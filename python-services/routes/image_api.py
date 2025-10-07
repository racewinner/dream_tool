"""
Image API Routes - Handles image retrieval and processing
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
import os
import logging
from typing import Dict, Any, List, Optional
import shutil
from datetime import datetime

from core.auth import verify_token
from core.database import get_db_session
from models.database_models import SurveyImage, Survey
from services.image_service import ImageService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/images", tags=["Images"])

# Initialize service
image_service = ImageService()

@router.get("/survey/{survey_id}")
async def get_survey_images(
    survey_id: int,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Get all images for a survey
    """
    try:
        logger.info(f"User {current_user['id']} requesting images for survey {survey_id}")
        
        # Check if survey exists
        db_session = next(get_db_session())
        survey = db_session.query(Survey).filter(Survey.id == survey_id).first()
        
        if not survey:
            raise HTTPException(status_code=404, detail=f"Survey with ID {survey_id} not found")
        
        # Get images
        images = await image_service.get_survey_images(survey_id)
        
        return {
            "success": True,
            "survey_id": survey_id,
            "images": images,
            "count": len(images)
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error getting survey images: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting survey images: {str(e)}")

@router.get("/view/{image_id}")
async def view_image(
    image_id: int,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    View an image by ID
    """
    try:
        logger.info(f"User {current_user['id']} viewing image {image_id}")
        
        # Get image from database
        db_session = next(get_db_session())
        image = db_session.query(SurveyImage).filter(SurveyImage.id == image_id).first()
        
        if not image:
            raise HTTPException(status_code=404, detail=f"Image with ID {image_id} not found")
        
        # Check if file exists
        if not os.path.exists(image.local_path):
            raise HTTPException(status_code=404, detail=f"Image file not found on server")
        
        # Return file response
        return FileResponse(
            path=image.local_path,
            media_type=image.mime_type or "image/jpeg",
            filename=image.file_name
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error viewing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error viewing image: {str(e)}")

@router.post("/upload")
async def upload_image(
    survey_id: int = Form(...),
    question_field: str = Form(None),
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Upload a new image and associate it with a survey
    """
    try:
        logger.info(f"User {current_user['id']} uploading image for survey {survey_id}")
        
        # Check if survey exists
        db_session = next(get_db_session())
        survey = db_session.query(Survey).filter(Survey.id == survey_id).first()
        
        if not survey:
            raise HTTPException(status_code=404, detail=f"Survey with ID {survey_id} not found")
        
        # Read file content
        contents = await file.read()
        
        # Process and store image
        image_info = await image_service.process_and_store_image(
            image_data=contents,
            original_filename=file.filename,
            mime_type=file.content_type
        )
        
        # Save to database
        survey_image = SurveyImage(
            survey_id=survey_id,
            original_url=None,  # Directly uploaded, no original URL
            local_path=image_info["local_path"],
            mime_type=file.content_type,
            file_name=image_info["file_name"],
            question_field=question_field
        )
        db_session.add(survey_image)
        db_session.commit()
        
        return {
            "success": True,
            "image_id": survey_image.id,
            "survey_id": survey_id,
            "file_name": image_info["file_name"],
            "size": image_info["size"]
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")

@router.delete("/{image_id}")
async def delete_image(
    image_id: int,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Delete an image
    """
    try:
        logger.info(f"User {current_user['id']} deleting image {image_id}")
        
        # Get image from database
        db_session = next(get_db_session())
        image = db_session.query(SurveyImage).filter(SurveyImage.id == image_id).first()
        
        if not image:
            raise HTTPException(status_code=404, detail=f"Image with ID {image_id} not found")
        
        # Delete file if it exists
        if os.path.exists(image.local_path):
            os.remove(image.local_path)
            logger.info(f"Deleted image file: {image.local_path}")
        
        # Delete from database
        db_session.delete(image)
        db_session.commit()
        
        return {
            "success": True,
            "message": f"Image {image_id} deleted successfully"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error deleting image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting image: {str(e)}")

@router.post("/process-survey-images/{survey_id}")
async def process_survey_images(
    survey_id: int,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """
    Process and store all images for a survey from its raw data
    """
    try:
        logger.info(f"User {current_user['id']} processing images for survey {survey_id}")
        
        # Get survey from database
        db_session = next(get_db_session())
        survey = db_session.query(Survey).filter(Survey.id == survey_id).first()
        
        if not survey:
            raise HTTPException(status_code=404, detail=f"Survey with ID {survey_id} not found")
        
        if not survey.raw_data:
            raise HTTPException(status_code=400, detail=f"Survey {survey_id} has no raw data")
        
        # Process images
        stored_images = await image_service.extract_and_store_survey_images(
            survey_id=survey_id,
            raw_data=survey.raw_data
        )
        
        return {
            "success": True,
            "survey_id": survey_id,
            "processed_images": len(stored_images),
            "images": stored_images
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error processing survey images: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing survey images: {str(e)}")
