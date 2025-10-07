"""
Solar Photo Service - Download and store solar PV component photos
"""

import os
import logging
import aiohttp
import uuid
from io import BytesIO
from typing import Dict, Any, Optional, List
import hashlib
from datetime import datetime
from PIL import Image
import asyncio

from models.solar_analysis_models import SolarComponentDetected, ComponentType
from core.database import get_db_session

logger = logging.getLogger(__name__)

class SolarPhotoService:
    """
    Service for downloading and storing solar PV component photos
    """
    
    def __init__(self):
        """Initialize the photo service with storage configuration"""
        self.storage_path = os.getenv("IMAGE_STORAGE_PATH", "storage/solar_images")
        self.kobo_api_token = os.getenv("KOBO_API_TOKEN", "")
        
        # Ensure storage directory exists
        os.makedirs(self.storage_path, exist_ok=True)
    
    async def download_photo(self, url: str, max_retries: int = 3) -> BytesIO:
        """
        Download photo from URL with retry logic
        
        Args:
            url: URL to download the photo
            max_retries: Maximum number of retry attempts
            
        Returns:
            BytesIO object containing the image data
        """
        headers = {}
        if self.kobo_api_token and "kobo" in url.lower():
            headers["Authorization"] = f"Token {self.kobo_api_token}"
        
        for attempt in range(max_retries):
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, headers=headers, timeout=30) as response:
                        if response.status != 200:
                            logger.warning(f"Download failed with status {response.status}: {url}")
                            if attempt == max_retries - 1:
                                raise Exception(f"Failed to download photo: HTTP {response.status}")
                            await asyncio.sleep(1 * (attempt + 1))  # Exponential backoff
                            continue
                        
                        content = await response.read()
                        
                        # Validate image
                        image_data = BytesIO(content)
                        try:
                            image = Image.open(image_data)
                            image.verify()  # Verify it's a valid image
                            image_data.seek(0)  # Reset position after verification
                            return image_data
                        except Exception as e:
                            logger.warning(f"Invalid image data: {str(e)}")
                            if attempt == max_retries - 1:
                                raise Exception(f"Invalid image data: {str(e)}")
                            await asyncio.sleep(1 * (attempt + 1))
            
            except asyncio.TimeoutError:
                logger.warning(f"Download timeout (attempt {attempt + 1}): {url}")
                if attempt == max_retries - 1:
                    raise Exception("Download timeout after all retries")
                await asyncio.sleep(1 * (attempt + 1))
            
            except Exception as e:
                logger.warning(f"Download error (attempt {attempt + 1}): {str(e)}")
                if attempt == max_retries - 1:
                    raise Exception(f"Download error: {str(e)}")
                await asyncio.sleep(1 * (attempt + 1))
        
        raise Exception("Failed to download photo after all retries")
    
    def store_photo(self, image_data: BytesIO, original_filename: str) -> str:
        """
        Store photo in the file system
        
        Args:
            image_data: BytesIO object containing the image data
            original_filename: Original filename
            
        Returns:
            Path to the stored photo
        """
        try:
            # Generate unique filename
            file_hash = hashlib.md5(image_data.getvalue()).hexdigest()
            file_ext = os.path.splitext(original_filename)[1].lower() or ".jpg"
            
            # Create date-based directory structure
            today = datetime.now()
            date_path = today.strftime("%Y/%m/%d")
            directory = os.path.join(self.storage_path, date_path)
            os.makedirs(directory, exist_ok=True)
            
            # Create filename
            filename = f"{file_hash}{file_ext}"
            file_path = os.path.join(directory, filename)
            
            # Save file
            with open(file_path, "wb") as f:
                f.write(image_data.getvalue())
            
            # Return relative path
            return os.path.join(date_path, filename)
        
        except Exception as e:
            logger.error(f"Error storing photo: {str(e)}")
            raise Exception(f"Error storing photo: {str(e)}")
    
    def optimize_image(self, image_data: BytesIO, max_size: int = 1200) -> BytesIO:
        """
        Optimize image for storage (resize, compress)
        
        Args:
            image_data: BytesIO object containing the image data
            max_size: Maximum dimension (width or height)
            
        Returns:
            BytesIO object containing the optimized image data
        """
        try:
            # Open image
            image = Image.open(image_data)
            
            # Resize if needed
            width, height = image.size
            if width > max_size or height > max_size:
                if width > height:
                    new_width = max_size
                    new_height = int(height * (max_size / width))
                else:
                    new_height = max_size
                    new_width = int(width * (max_size / height))
                
                image = image.resize((new_width, new_height), Image.LANCZOS)
                logger.info(f"Resized image from {width}x{height} to {new_width}x{new_height}")
            
            # Save to buffer with optimization
            output = BytesIO()
            format = image.format or "JPEG"
            image.save(output, format=format, optimize=True, quality=85)
            output.seek(0)
            
            return output
        
        except Exception as e:
            logger.error(f"Error optimizing image: {str(e)}")
            return image_data  # Return original if optimization fails
    
    async def process_component_photo(
        self, 
        assessment_id: str, 
        component_type: str,
        photo_url: str,
        filename: str
    ) -> Dict[str, Any]:
        """
        Process a component photo (download, optimize, store)
        
        Args:
            assessment_id: ID of the assessment
            component_type: Type of component
            photo_url: URL to download the photo
            filename: Original filename
            
        Returns:
            Dict containing photo metadata
        """
        try:
            # Download photo
            image_data = await self.download_photo(photo_url)
            
            # Optimize image
            optimized_data = self.optimize_image(image_data)
            
            # Store photo
            stored_path = self.store_photo(optimized_data, filename)
            
            # Create full URL
            photo_url = f"/storage/solar_images/{stored_path}"
            
            # Create component in database
            db_session = next(get_db_session())
            component = SolarComponentDetected(
                assessment_id=assessment_id,
                component_type=component_type,
                photo_url=photo_url,
                original_photo_url=photo_url,
                detection_confidence=0.0,
                analysis_results={}
            )
            db_session.add(component)
            db_session.commit()
            
            return {
                "id": str(component.id),
                "assessment_id": assessment_id,
                "component_type": component_type,
                "photo_url": photo_url,
                "stored_path": stored_path
            }
        
        except Exception as e:
            logger.error(f"Error processing component photo: {str(e)}")
            raise Exception(f"Error processing component photo: {str(e)}")
    
    async def create_annotated_photo(
        self,
        component_id: str,
        annotations: List[Dict[str, Any]]
    ) -> str:
        """
        Create annotated version of photo with bounding boxes and labels
        
        Args:
            component_id: ID of the component
            annotations: List of annotations with bounding boxes
            
        Returns:
            URL of annotated photo
        """
        try:
            # Get component from database
            db_session = next(get_db_session())
            component = db_session.query(SolarComponentDetected).filter(
                SolarComponentDetected.id == component_id
            ).first()
            
            if not component:
                raise Exception(f"Component not found: {component_id}")
            
            # Get original photo path
            photo_path = component.photo_url
            if photo_path.startswith("/storage/"):
                photo_path = photo_path.replace("/storage/", "")
                photo_path = os.path.join(self.storage_path, "..", photo_path)
            
            # Open original image
            with open(photo_path, "rb") as f:
                image_data = BytesIO(f.read())
            
            # Create annotated image
            from PIL import ImageDraw, ImageFont
            
            image = Image.open(image_data)
            draw = ImageDraw.Draw(image)
            
            # Try to load a font
            try:
                font = ImageFont.truetype("arial.ttf", 20)
            except:
                font = ImageFont.load_default()
            
            # Draw annotations
            for annotation in annotations:
                # Draw bounding box
                bbox = annotation.get("bounding_box", {})
                if bbox:
                    x, y, w, h = bbox.get("x", 0), bbox.get("y", 0), bbox.get("width", 0), bbox.get("height", 0)
                    draw.rectangle(
                        [(x, y), (x + w, y + h)],
                        outline="red",
                        width=3
                    )
                    
                    # Draw label
                    label = annotation.get("label", "")
                    confidence = annotation.get("confidence", 0)
                    text = f"{label} ({confidence:.0%})"
                    draw.text((x, y - 25), text, fill="red", font=font)
            
            # Save annotated image
            output = BytesIO()
            image.save(output, format="JPEG", quality=85)
            output.seek(0)
            
            # Store annotated image
            original_filename = os.path.basename(photo_path)
            annotated_filename = f"annotated_{original_filename}"
            stored_path = self.store_photo(output, annotated_filename)
            
            # Create full URL
            annotated_url = f"/storage/solar_images/{stored_path}"
            
            # Update component in database
            component.annotated_photo_url = annotated_url
            db_session.commit()
            
            return annotated_url
        
        except Exception as e:
            logger.error(f"Error creating annotated photo: {str(e)}")
            raise Exception(f"Error creating annotated photo: {str(e)}")
    
    async def process_kobo_submission(
        self,
        assessment_id: str,
        photo_mapping: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Process photos from a KoboToolbox submission
        
        Args:
            assessment_id: ID of the assessment
            photo_mapping: Dict mapping field names to component types and URLs
            
        Returns:
            Dict containing processing results
        """
        results = {
            "assessment_id": assessment_id,
            "processed": [],
            "failed": []
        }
        
        for field_name, mapping in photo_mapping.items():
            try:
                component_type = mapping["component_type"]
                download_url = mapping["download_url"]
                filename = mapping["filename"]
                
                # Process photo
                component = await self.process_component_photo(
                    assessment_id=assessment_id,
                    component_type=component_type,
                    photo_url=download_url,
                    filename=filename
                )
                
                results["processed"].append({
                    "field_name": field_name,
                    "component_id": component["id"],
                    "component_type": component_type,
                    "photo_url": component["photo_url"]
                })
            
            except Exception as e:
                logger.error(f"Error processing photo {field_name}: {str(e)}")
                results["failed"].append({
                    "field_name": field_name,
                    "error": str(e)
                })
        
        return results
