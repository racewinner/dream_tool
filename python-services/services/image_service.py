"""
Image Service - Handles image processing and storage for survey attachments
"""

import os
import aiohttp
import logging
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional, Union, Tuple, BinaryIO
from fastapi import HTTPException
from PIL import Image
import io
import asyncio
from urllib.parse import urlparse

from core.database import get_db_session
from models.database_models import SurveyImage, Survey

logger = logging.getLogger(__name__)

class ImageService:
    """
    Service for handling image processing and storage
    """
    
    def __init__(self, storage_path: str = None):
        """Initialize the image service with storage configuration"""
        self.storage_path = storage_path or os.environ.get("IMAGE_STORAGE_PATH", "storage/images")
        self._ensure_storage_path()
    
    def _ensure_storage_path(self):
        """Ensure the storage directory exists"""
        os.makedirs(self.storage_path, exist_ok=True)
        logger.info(f"Image storage path set to: {self.storage_path}")
    
    async def download_image(self, url: str) -> bytes:
        """
        Download image from URL
        
        Args:
            url: The URL of the image to download
            
        Returns:
            bytes: The image data
            
        Raises:
            HTTPException: If the download fails
        """
        try:
            logger.info(f"Downloading image from: {url}")
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status != 200:
                        logger.error(f"Failed to download image: {response.status}")
                        raise HTTPException(status_code=500, detail=f"Failed to download image: HTTP {response.status}")
                    
                    return await response.read()
        except Exception as e:
            logger.error(f"Image download error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Image download error: {str(e)}")
    
    def _generate_file_path(self, image_data: bytes, original_filename: str) -> str:
        """
        Generate a unique file path for the image
        
        Args:
            image_data: The image data
            original_filename: The original filename
            
        Returns:
            str: The generated file path
        """
        # Create hash of image data for uniqueness
        file_hash = hashlib.md5(image_data).hexdigest()
        
        # Extract extension from original filename
        _, ext = os.path.splitext(original_filename)
        if not ext:
            ext = ".jpg"  # Default extension
        
        # Generate path with date-based directory structure
        today = datetime.now()
        year_month = today.strftime("%Y/%m")
        directory = os.path.join(self.storage_path, year_month)
        os.makedirs(directory, exist_ok=True)
        
        # Final path: storage/images/YYYY/MM/hash_originalname.ext
        filename = f"{file_hash}_{os.path.basename(original_filename)}"
        return os.path.join(directory, filename)
    
    async def process_and_store_image(self, image_data: bytes, original_filename: str, 
                                     mime_type: str = "image/jpeg") -> Dict[str, Any]:
        """
        Process and store an image
        
        Args:
            image_data: The image data
            original_filename: The original filename
            mime_type: The MIME type of the image
            
        Returns:
            Dict: Information about the stored image
        """
        try:
            # Generate file path
            file_path = self._generate_file_path(image_data, original_filename)
            
            # Process image (resize if needed)
            processed_image = self._process_image(image_data)
            
            # Save to disk
            with open(file_path, "wb") as f:
                f.write(processed_image)
            
            logger.info(f"Image stored at: {file_path}")
            
            return {
                "local_path": file_path,
                "file_name": os.path.basename(file_path),
                "mime_type": mime_type,
                "size": len(processed_image),
                "original_filename": original_filename
            }
        except Exception as e:
            logger.error(f"Image processing error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Image processing error: {str(e)}")
    
    def _process_image(self, image_data: bytes, max_size: int = 1200) -> bytes:
        """
        Process image - resize if needed and optimize
        
        Args:
            image_data: The image data
            max_size: Maximum dimension (width or height)
            
        Returns:
            bytes: The processed image data
        """
        try:
            # Open image
            img = Image.open(io.BytesIO(image_data))
            
            # Resize if needed
            width, height = img.size
            if width > max_size or height > max_size:
                if width > height:
                    new_width = max_size
                    new_height = int(height * (max_size / width))
                else:
                    new_height = max_size
                    new_width = int(width * (max_size / height))
                
                img = img.resize((new_width, new_height), Image.LANCZOS)
                logger.info(f"Resized image from {width}x{height} to {new_width}x{new_height}")
            
            # Save to buffer with optimization
            buffer = io.BytesIO()
            format = img.format or "JPEG"
            img.save(buffer, format=format, optimize=True, quality=85)
            
            return buffer.getvalue()
        except Exception as e:
            logger.error(f"Image processing error: {str(e)}")
            # Return original if processing fails
            return image_data
    
    async def extract_and_store_survey_images(self, survey_id: int, raw_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract and store images from survey data
        
        Args:
            survey_id: The survey ID
            raw_data: The raw survey data
            
        Returns:
            List[Dict]: Information about the stored images
        """
        stored_images = []
        
        try:
            # Find attachments in raw data
            attachments = raw_data.get("_attachments", [])
            if not attachments:
                logger.info(f"No attachments found in survey {survey_id}")
                return []
            
            logger.info(f"Found {len(attachments)} attachments in survey {survey_id}")
            
            # Process each attachment
            for attachment in attachments:
                try:
                    # Extract attachment info
                    download_url = attachment.get("download_url") or attachment.get("download_large_url")
                    if not download_url:
                        logger.warning(f"No download URL for attachment in survey {survey_id}")
                        continue
                    
                    mime_type = attachment.get("mimetype", "image/jpeg")
                    filename = attachment.get("filename") or attachment.get("media_file_basename", "unknown.jpg")
                    question_field = attachment.get("question_xpath", "")
                    
                    # Download image
                    image_data = await self.download_image(download_url)
                    
                    # Process and store
                    image_info = await self.process_and_store_image(
                        image_data, 
                        filename, 
                        mime_type
                    )
                    
                    # Save to database
                    db_session = next(get_db_session())
                    survey_image = SurveyImage(
                        survey_id=survey_id,
                        original_url=download_url,
                        local_path=image_info["local_path"],
                        mime_type=mime_type,
                        file_name=image_info["file_name"],
                        question_field=question_field
                    )
                    db_session.add(survey_image)
                    db_session.commit()
                    
                    stored_images.append({
                        "id": survey_image.id,
                        "survey_id": survey_id,
                        "file_name": image_info["file_name"],
                        "local_path": image_info["local_path"],
                        "question_field": question_field
                    })
                    
                    logger.info(f"Stored image {survey_image.id} for survey {survey_id}")
                    
                except Exception as e:
                    logger.error(f"Error processing attachment for survey {survey_id}: {str(e)}")
                    continue
            
            return stored_images
            
        except Exception as e:
            logger.error(f"Error extracting images from survey {survey_id}: {str(e)}")
            return []
    
    async def get_survey_images(self, survey_id: int) -> List[Dict[str, Any]]:
        """
        Get all images for a survey
        
        Args:
            survey_id: The survey ID
            
        Returns:
            List[Dict]: Information about the survey images
        """
        try:
            db_session = next(get_db_session())
            images = db_session.query(SurveyImage).filter(SurveyImage.survey_id == survey_id).all()
            
            return [
                {
                    "id": img.id,
                    "survey_id": img.survey_id,
                    "file_name": img.file_name,
                    "local_path": img.local_path,
                    "mime_type": img.mime_type,
                    "question_field": img.question_field,
                    "created_at": img.created_at
                }
                for img in images
            ]
        except Exception as e:
            logger.error(f"Error getting images for survey {survey_id}: {str(e)}")
            return []
