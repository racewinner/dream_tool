# 📸 **Image Processing Implementation**

## **Overview**

We've successfully implemented a complete image processing system for the DREAM Tool that allows Python services to handle images from surveys. This implementation bridges a gap in the existing system, where survey images were only referenced but not properly processed or stored.

## **Components Created**

### **1. SQLAlchemy Database Models**

Added `SurveyImage` model to `models/database_models.py`:

```python
class SurveyImage(Base):
    __tablename__ = 'survey_images'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    survey_id = Column('surveyId', Integer, ForeignKey('surveys.id'), nullable=False)
    original_url = Column('originalUrl', String, nullable=True)
    local_path = Column('localPath', String, nullable=False)
    mime_type = Column('mimeType', String, nullable=True)
    file_name = Column('fileName', String, nullable=False)
    question_field = Column('questionField', String, nullable=True)
    created_at = Column('createdAt', DateTime, nullable=False, default=func.now())
    updated_at = Column('updatedAt', DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    # Relationships
    survey = relationship("Survey", back_populates="images")
```

Updated `Survey` model with relationship to images:

```python
class Survey(Base):
    # ... existing fields ...
    
    # Relationships
    facility = relationship("Facility", back_populates="surveys")
    images = relationship("SurveyImage", back_populates="survey", cascade="all, delete-orphan")
```

### **2. Image Service**

Created `services/image_service.py` with the following capabilities:

- **Image Download**: Download images from external URLs (like KoboToolbox)
- **Image Processing**: Resize, optimize, and store images
- **Image Storage**: Save images with unique filenames in date-based directory structure
- **Survey Image Extraction**: Extract images from raw survey data
- **Database Integration**: Save image metadata to database

### **3. Image API Routes**

Created `routes/image_api.py` with endpoints:

- **GET `/api/python/images/survey/{survey_id}`**: Get all images for a survey
- **GET `/api/python/images/view/{image_id}`**: View a specific image
- **POST `/api/python/images/upload`**: Upload a new image
- **DELETE `/api/python/images/{image_id}`**: Delete an image
- **POST `/api/python/images/process-survey-images/{survey_id}`**: Process all images in a survey

### **4. Data Import Integration**

Updated `services/data_import.py` to automatically process images when importing surveys:

```python
# Process images if available
if raw_data and '_attachments' in raw_data and len(raw_data['_attachments']) > 0:
    try:
        from services.image_service import ImageService
        image_service = ImageService()
        stored_images = await image_service.extract_and_store_survey_images(
            survey_id=survey.id,
            raw_data=raw_data
        )
        logger.info(f"Processed {len(stored_images)} images for survey {survey.id}")
    except Exception as img_error:
        logger.warning(f"Image processing error for survey {survey.id}: {str(img_error)}")
        # Continue even if image processing fails
```

## **Features**

1. **Automatic Image Processing**: Images are automatically extracted and processed when surveys are imported
2. **Image Optimization**: Images are resized and optimized for storage efficiency
3. **Secure Storage**: Images are stored with unique filenames in a structured directory
4. **Database Integration**: Image metadata is stored in the database with relationships to surveys
5. **API Access**: Images can be accessed via API endpoints
6. **Manual Upload**: Images can be manually uploaded and associated with surveys

## **How It Works**

### **Image Flow from Survey Import**

1. Survey data is imported from KoboToolbox or other sources
2. Survey data is saved to the database
3. If attachments are found in the raw data:
   - Each attachment URL is downloaded
   - Images are processed (resized, optimized)
   - Images are stored in the file system
   - Image metadata is saved to the database

### **Image Retrieval**

1. Client requests images for a survey via API
2. API returns metadata for all images associated with the survey
3. Client can view individual images using the image ID

## **Benefits**

1. **Complete Data Access**: All survey data, including images, is now accessible
2. **Improved User Experience**: Users can view images associated with surveys
3. **Data Integrity**: Images are properly stored and linked to their source surveys
4. **Storage Efficiency**: Images are optimized for storage
5. **Flexible API**: Images can be accessed programmatically

## **Next Steps**

1. **Frontend Integration**: Create UI components to display survey images
2. **Image Analysis**: Add image analysis capabilities (e.g., object detection)
3. **Batch Processing**: Add batch processing for historical surveys
4. **Access Control**: Add fine-grained access control for images

## **Conclusion**

This implementation completes the image handling capabilities of the DREAM Tool, ensuring that all survey data, including images, is properly processed, stored, and accessible. The system is designed to be efficient, scalable, and easy to integrate with the existing frontend.
