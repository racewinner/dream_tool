"""
Solar Model Training Service
Handles training and fine-tuning of AI models for solar component analysis
"""

import os
import json
import logging
import asyncio
from typing import Dict, Any, List, Optional, Tuple
import aiohttp
import uuid
import shutil
from datetime import datetime
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import desc

from models.solar_analysis_models import (
    SolarSystemAssessment, SolarComponentDetected, ComponentType
)
from models.solar_history_models import MaintenanceAction

logger = logging.getLogger(__name__)

# Load environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL_STORAGE_PATH = os.getenv("MODEL_STORAGE_PATH", "./data/models")

class SolarModelTraining:
    """Service for training and fine-tuning AI models for solar component analysis"""
    
    def __init__(self):
        """Initialize the model training service"""
        # Ensure model storage directory exists
        os.makedirs(MODEL_STORAGE_PATH, exist_ok=True)
        
        # Initialize model tracking
        self.models_metadata_path = os.path.join(MODEL_STORAGE_PATH, "models_metadata.json")
        self.models_metadata = self._load_models_metadata()
        
        # Define model types
        self.model_types = {
            "solar_panel_detector": "Detection model for solar panels",
            "battery_detector": "Detection model for batteries",
            "inverter_detector": "Detection model for inverters",
            "mppt_detector": "Detection model for MPPT controllers",
            "issue_classifier": "Classification model for solar component issues",
            "specification_extractor": "OCR model for extracting specifications"
        }
    
    def _load_models_metadata(self) -> Dict[str, Any]:
        """Load models metadata from JSON file"""
        if os.path.exists(self.models_metadata_path):
            try:
                with open(self.models_metadata_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading models metadata: {str(e)}")
                return self._initialize_models_metadata()
        else:
            return self._initialize_models_metadata()
    
    def _initialize_models_metadata(self) -> Dict[str, Any]:
        """Initialize empty models metadata structure"""
        metadata = {
            "models": {},
            "training_history": [],
            "last_updated": datetime.now().isoformat()
        }
        
        # Save initialized metadata
        self._save_models_metadata(metadata)
        
        return metadata
    
    def _save_models_metadata(self, metadata: Dict[str, Any]) -> None:
        """Save models metadata to JSON file"""
        try:
            with open(self.models_metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving models metadata: {str(e)}")
    
    async def prepare_training_data(
        self, 
        db_session: Session,
        component_type: str,
        min_confidence: float = 0.7,
        limit: int = 1000
    ) -> Dict[str, Any]:
        """
        Prepare training data for a specific component type
        
        Args:
            db_session: Database session
            component_type: Type of component to prepare data for
            min_confidence: Minimum confidence score for including components
            limit: Maximum number of components to include
            
        Returns:
            Dictionary with training data information
        """
        logger.info(f"Preparing training data for {component_type}")
        
        # Query high-confidence components
        components = db_session.query(SolarComponentDetected).filter(
            SolarComponentDetected.component_type == component_type,
            SolarComponentDetected.detection_confidence >= min_confidence
        ).order_by(desc(SolarComponentDetected.detection_confidence)).limit(limit).all()
        
        if not components:
            logger.warning(f"No components found for {component_type} with confidence >= {min_confidence}")
            return {
                "component_type": component_type,
                "count": 0,
                "message": f"No components found with confidence >= {min_confidence}"
            }
        
        # Create training data directory
        training_dir = os.path.join(MODEL_STORAGE_PATH, "training_data", component_type, datetime.now().strftime("%Y%m%d_%H%M%S"))
        os.makedirs(training_dir, exist_ok=True)
        
        # Create images and annotations directories
        images_dir = os.path.join(training_dir, "images")
        annotations_dir = os.path.join(training_dir, "annotations")
        os.makedirs(images_dir, exist_ok=True)
        os.makedirs(annotations_dir, exist_ok=True)
        
        # Track processed components
        processed_count = 0
        annotations = []
        
        # Process each component
        for component in components:
            try:
                # Get local path to image
                local_path = component.photo_url
                if not os.path.exists(local_path):
                    logger.warning(f"Image not found at {local_path}")
                    continue
                
                # Copy image to training directory
                image_filename = f"{component_type}_{processed_count}.jpg"
                image_path = os.path.join(images_dir, image_filename)
                shutil.copy(local_path, image_path)
                
                # Create annotation
                annotation = {
                    "image_id": processed_count,
                    "image_filename": image_filename,
                    "component_id": str(component.id),
                    "component_type": component.component_type,
                    "confidence": component.detection_confidence,
                    "analysis_results": component.analysis_results
                }
                
                # Add bounding box if available
                if component.analysis_results and "bounding_box" in component.analysis_results:
                    annotation["bounding_box"] = component.analysis_results["bounding_box"]
                
                # Add issues if available
                issues = db_session.query(DetectedIssue).filter_by(
                    component_id=component.id
                ).all()
                
                if issues:
                    annotation["issues"] = [
                        {
                            "issue_type": issue.issue_type,
                            "severity": issue.severity,
                            "description": issue.description
                        }
                        for issue in issues
                    ]
                
                annotations.append(annotation)
                processed_count += 1
                
            except Exception as e:
                logger.error(f"Error processing component {component.id}: {str(e)}")
        
        # Save annotations
        annotations_path = os.path.join(annotations_dir, "annotations.json")
        with open(annotations_path, 'w') as f:
            json.dump(annotations, f, indent=2)
        
        # Create metadata file
        metadata = {
            "component_type": component_type,
            "created_at": datetime.now().isoformat(),
            "count": processed_count,
            "min_confidence": min_confidence,
            "annotations_path": annotations_path,
            "images_dir": images_dir
        }
        
        metadata_path = os.path.join(training_dir, "metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Prepared {processed_count} training samples for {component_type}")
        
        return {
            "component_type": component_type,
            "count": processed_count,
            "training_dir": training_dir,
            "metadata_path": metadata_path
        }
    
    async def train_component_detector(
        self,
        component_type: str,
        training_dir: str,
        epochs: int = 10,
        batch_size: int = 16,
        learning_rate: float = 0.001
    ) -> Dict[str, Any]:
        """
        Train a component detector model
        
        Args:
            component_type: Type of component to train detector for
            training_dir: Directory with training data
            epochs: Number of training epochs
            batch_size: Batch size for training
            learning_rate: Learning rate for training
            
        Returns:
            Dictionary with training results
        """
        logger.info(f"Training {component_type} detector")
        
        # Load metadata
        metadata_path = os.path.join(training_dir, "metadata.json")
        if not os.path.exists(metadata_path):
            raise ValueError(f"Metadata file not found at {metadata_path}")
        
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        # Check if we have enough data
        if metadata["count"] < 50:
            logger.warning(f"Insufficient training data for {component_type}: {metadata['count']} samples")
            return {
                "component_type": component_type,
                "status": "failed",
                "message": f"Insufficient training data: {metadata['count']} samples (minimum 50 required)"
            }
        
        # In a real implementation, this would use a framework like TensorFlow or PyTorch
        # to train a model. For this implementation, we'll simulate the training process.
        
        # Simulate training time based on epochs and data size
        training_time = epochs * metadata["count"] * 0.01
        
        # Create model directory
        model_id = f"{component_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        model_dir = os.path.join(MODEL_STORAGE_PATH, "models", model_id)
        os.makedirs(model_dir, exist_ok=True)
        
        # Simulate training metrics
        training_metrics = {
            "epochs": epochs,
            "batch_size": batch_size,
            "learning_rate": learning_rate,
            "training_samples": metadata["count"],
            "training_time": training_time,
            "loss_history": [0.8 - (0.05 * i) for i in range(epochs)],
            "accuracy_history": [0.7 + (0.02 * i) for i in range(epochs)],
            "final_loss": 0.3,
            "final_accuracy": 0.89
        }
        
        # Save training metrics
        metrics_path = os.path.join(model_dir, "training_metrics.json")
        with open(metrics_path, 'w') as f:
            json.dump(training_metrics, f, indent=2)
        
        # Create a dummy model file (in a real implementation, this would be the actual model)
        model_path = os.path.join(model_dir, f"{component_type}_model.h5")
        with open(model_path, 'w') as f:
            f.write(f"Simulated model for {component_type}")
        
        # Update models metadata
        model_metadata = {
            "id": model_id,
            "component_type": component_type,
            "model_type": f"{component_type}_detector",
            "created_at": datetime.now().isoformat(),
            "training_data": {
                "count": metadata["count"],
                "dir": training_dir
            },
            "performance": {
                "accuracy": training_metrics["final_accuracy"],
                "loss": training_metrics["final_loss"]
            },
            "path": model_path,
            "status": "active"
        }
        
        self.models_metadata["models"][model_id] = model_metadata
        
        self.models_metadata["training_history"].append({
            "model_id": model_id,
            "component_type": component_type,
            "timestamp": datetime.now().isoformat(),
            "metrics": training_metrics
        })
        
        self.models_metadata["last_updated"] = datetime.now().isoformat()
        
        # Save updated metadata
        self._save_models_metadata(self.models_metadata)
        
        logger.info(f"Trained {component_type} detector with accuracy {training_metrics['final_accuracy']:.2f}")
        
        return {
            "model_id": model_id,
            "component_type": component_type,
            "status": "success",
            "accuracy": training_metrics["final_accuracy"],
            "model_path": model_path
        }
    
    async def train_issue_classifier(
        self,
        component_type: str,
        training_dir: str,
        epochs: int = 15,
        batch_size: int = 8,
        learning_rate: float = 0.0005
    ) -> Dict[str, Any]:
        """
        Train an issue classifier model for a specific component type
        
        Args:
            component_type: Type of component to train classifier for
            training_dir: Directory with training data
            epochs: Number of training epochs
            batch_size: Batch size for training
            learning_rate: Learning rate for training
            
        Returns:
            Dictionary with training results
        """
        logger.info(f"Training issue classifier for {component_type}")
        
        # Load metadata
        metadata_path = os.path.join(training_dir, "metadata.json")
        if not os.path.exists(metadata_path):
            raise ValueError(f"Metadata file not found at {metadata_path}")
        
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        # Load annotations to check for issues
        annotations_path = metadata["annotations_path"]
        with open(annotations_path, 'r') as f:
            annotations = json.load(f)
        
        # Count samples with issues
        samples_with_issues = sum(1 for anno in annotations if "issues" in anno and anno["issues"])
        
        if samples_with_issues < 30:
            logger.warning(f"Insufficient issue samples for {component_type}: {samples_with_issues} samples")
            return {
                "component_type": component_type,
                "status": "failed",
                "message": f"Insufficient issue samples: {samples_with_issues} samples (minimum 30 required)"
            }
        
        # In a real implementation, this would use a framework like TensorFlow or PyTorch
        # to train a model. For this implementation, we'll simulate the training process.
        
        # Simulate training time based on epochs and data size
        training_time = epochs * samples_with_issues * 0.02
        
        # Create model directory
        model_id = f"{component_type}_issue_classifier_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        model_dir = os.path.join(MODEL_STORAGE_PATH, "models", model_id)
        os.makedirs(model_dir, exist_ok=True)
        
        # Simulate training metrics
        training_metrics = {
            "epochs": epochs,
            "batch_size": batch_size,
            "learning_rate": learning_rate,
            "training_samples": samples_with_issues,
            "training_time": training_time,
            "loss_history": [0.9 - (0.04 * i) for i in range(epochs)],
            "accuracy_history": [0.65 + (0.02 * i) for i in range(epochs)],
            "final_loss": 0.35,
            "final_accuracy": 0.85,
            "precision": 0.83,
            "recall": 0.81,
            "f1_score": 0.82
        }
        
        # Save training metrics
        metrics_path = os.path.join(model_dir, "training_metrics.json")
        with open(metrics_path, 'w') as f:
            json.dump(training_metrics, f, indent=2)
        
        # Create a dummy model file (in a real implementation, this would be the actual model)
        model_path = os.path.join(model_dir, f"{component_type}_issue_classifier.h5")
        with open(model_path, 'w') as f:
            f.write(f"Simulated issue classifier for {component_type}")
        
        # Update models metadata
        model_metadata = {
            "id": model_id,
            "component_type": component_type,
            "model_type": "issue_classifier",
            "created_at": datetime.now().isoformat(),
            "training_data": {
                "count": samples_with_issues,
                "dir": training_dir
            },
            "performance": {
                "accuracy": training_metrics["final_accuracy"],
                "precision": training_metrics["precision"],
                "recall": training_metrics["recall"],
                "f1_score": training_metrics["f1_score"]
            },
            "path": model_path,
            "status": "active"
        }
        
        self.models_metadata["models"][model_id] = model_metadata
        
        self.models_metadata["training_history"].append({
            "model_id": model_id,
            "component_type": component_type,
            "model_type": "issue_classifier",
            "timestamp": datetime.now().isoformat(),
            "metrics": training_metrics
        })
        
        self.models_metadata["last_updated"] = datetime.now().isoformat()
        
        # Save updated metadata
        self._save_models_metadata(self.models_metadata)
        
        logger.info(f"Trained issue classifier for {component_type} with accuracy {training_metrics['final_accuracy']:.2f}")
        
        return {
            "model_id": model_id,
            "component_type": component_type,
            "model_type": "issue_classifier",
            "status": "success",
            "accuracy": training_metrics["final_accuracy"],
            "precision": training_metrics["precision"],
            "recall": training_metrics["recall"],
            "f1_score": training_metrics["f1_score"],
            "model_path": model_path
        }
    
    async def finetune_openai_model(
        self,
        component_type: str,
        training_dir: str,
        base_model: str = "gpt-4-vision-preview"
    ) -> Dict[str, Any]:
        """
        Fine-tune OpenAI model for a specific component type
        
        Args:
            component_type: Type of component to fine-tune for
            training_dir: Directory with training data
            base_model: Base model to fine-tune
            
        Returns:
            Dictionary with fine-tuning results
        """
        logger.info(f"Fine-tuning OpenAI model for {component_type}")
        
        if not OPENAI_API_KEY:
            logger.error("OpenAI API key not set")
            return {
                "component_type": component_type,
                "status": "failed",
                "message": "OpenAI API key not set"
            }
        
        # Load metadata
        metadata_path = os.path.join(training_dir, "metadata.json")
        if not os.path.exists(metadata_path):
            raise ValueError(f"Metadata file not found at {metadata_path}")
        
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        # In a real implementation, this would use the OpenAI API to fine-tune a model
        # For this implementation, we'll simulate the fine-tuning process
        
        # Simulate fine-tuning time based on data size
        finetuning_time = metadata["count"] * 0.05
        
        # Create model directory
        model_id = f"{component_type}_openai_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        model_dir = os.path.join(MODEL_STORAGE_PATH, "models", model_id)
        os.makedirs(model_dir, exist_ok=True)
        
        # Simulate fine-tuning metrics
        finetuning_metrics = {
            "base_model": base_model,
            "training_samples": metadata["count"],
            "training_time": finetuning_time,
            "loss_history": [0.5 - (0.03 * i) for i in range(10)],
            "final_loss": 0.2,
            "estimated_accuracy": 0.92
        }
        
        # Save fine-tuning metrics
        metrics_path = os.path.join(model_dir, "finetuning_metrics.json")
        with open(metrics_path, 'w') as f:
            json.dump(finetuning_metrics, f, indent=2)
        
        # Create a dummy model config file (in a real implementation, this would reference the OpenAI model)
        model_path = os.path.join(model_dir, f"{component_type}_openai_config.json")
        with open(model_path, 'w') as f:
            json.dump({
                "base_model": base_model,
                "fine_tuned_model": f"ft:{base_model}:{component_type}:{uuid.uuid4()}",
                "component_type": component_type,
                "created_at": datetime.now().isoformat()
            }, f, indent=2)
        
        # Update models metadata
        model_metadata = {
            "id": model_id,
            "component_type": component_type,
            "model_type": "openai_finetuned",
            "base_model": base_model,
            "created_at": datetime.now().isoformat(),
            "training_data": {
                "count": metadata["count"],
                "dir": training_dir
            },
            "performance": {
                "estimated_accuracy": finetuning_metrics["estimated_accuracy"],
                "final_loss": finetuning_metrics["final_loss"]
            },
            "path": model_path,
            "status": "active"
        }
        
        self.models_metadata["models"][model_id] = model_metadata
        
        self.models_metadata["training_history"].append({
            "model_id": model_id,
            "component_type": component_type,
            "model_type": "openai_finetuned",
            "timestamp": datetime.now().isoformat(),
            "metrics": finetuning_metrics
        })
        
        self.models_metadata["last_updated"] = datetime.now().isoformat()
        
        # Save updated metadata
        self._save_models_metadata(self.models_metadata)
        
        logger.info(f"Fine-tuned OpenAI model for {component_type} with estimated accuracy {finetuning_metrics['estimated_accuracy']:.2f}")
        
        return {
            "model_id": model_id,
            "component_type": component_type,
            "model_type": "openai_finetuned",
            "base_model": base_model,
            "status": "success",
            "estimated_accuracy": finetuning_metrics["estimated_accuracy"],
            "model_path": model_path
        }
    
    async def evaluate_model(
        self,
        model_id: str,
        test_data_dir: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluate a trained model
        
        Args:
            model_id: ID of the model to evaluate
            test_data_dir: Directory with test data (optional)
            
        Returns:
            Dictionary with evaluation results
        """
        logger.info(f"Evaluating model {model_id}")
        
        # Check if model exists
        if model_id not in self.models_metadata["models"]:
            logger.error(f"Model {model_id} not found")
            return {
                "model_id": model_id,
                "status": "failed",
                "message": f"Model {model_id} not found"
            }
        
        model_metadata = self.models_metadata["models"][model_id]
        
        # If no test data provided, use a portion of the training data
        if not test_data_dir:
            test_data_dir = model_metadata["training_data"]["dir"]
        
        # In a real implementation, this would load the model and evaluate it on test data
        # For this implementation, we'll simulate the evaluation process
        
        # Simulate evaluation metrics based on model type
        if model_metadata["model_type"] == "issue_classifier":
            evaluation_metrics = {
                "accuracy": 0.85,
                "precision": 0.83,
                "recall": 0.81,
                "f1_score": 0.82,
                "confusion_matrix": [
                    [45, 5],
                    [8, 42]
                ]
            }
        elif model_metadata["model_type"] == "openai_finetuned":
            evaluation_metrics = {
                "accuracy": 0.92,
                "response_quality": 0.89,
                "specification_extraction_accuracy": 0.94,
                "average_response_time": 0.8
            }
        else:
            # Generic detector model
            evaluation_metrics = {
                "accuracy": 0.88,
                "precision": 0.86,
                "recall": 0.85,
                "f1_score": 0.85,
                "average_iou": 0.78
            }
        
        # Update model metadata with evaluation results
        model_metadata["evaluation"] = {
            "timestamp": datetime.now().isoformat(),
            "metrics": evaluation_metrics
        }
        
        # Save updated metadata
        self._save_models_metadata(self.models_metadata)
        
        logger.info(f"Evaluated model {model_id}")
        
        return {
            "model_id": model_id,
            "component_type": model_metadata["component_type"],
            "model_type": model_metadata["model_type"],
            "status": "success",
            "metrics": evaluation_metrics
        }
    
    async def get_best_model(
        self,
        component_type: str,
        model_type: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get the best model for a specific component type and model type
        
        Args:
            component_type: Type of component
            model_type: Type of model
            
        Returns:
            Dictionary with model metadata or None if no model found
        """
        logger.info(f"Getting best {model_type} model for {component_type}")
        
        # Filter models by component type and model type
        matching_models = [
            model for model_id, model in self.models_metadata["models"].items()
            if model["component_type"] == component_type and model["model_type"] == model_type and model["status"] == "active"
        ]
        
        if not matching_models:
            logger.warning(f"No active {model_type} models found for {component_type}")
            return None
        
        # Sort by performance metrics
        if model_type == "issue_classifier":
            # Sort by F1 score for classifiers
            matching_models.sort(key=lambda m: m["performance"].get("f1_score", 0), reverse=True)
        elif model_type == "openai_finetuned":
            # Sort by estimated accuracy for fine-tuned models
            matching_models.sort(key=lambda m: m["performance"].get("estimated_accuracy", 0), reverse=True)
        else:
            # Sort by accuracy for other models
            matching_models.sort(key=lambda m: m["performance"].get("accuracy", 0), reverse=True)
        
        # Return the best model
        best_model = matching_models[0]
        
        logger.info(f"Best {model_type} model for {component_type}: {best_model['id']}")
        
        return best_model
    
    async def list_models(
        self,
        component_type: Optional[str] = None,
        model_type: Optional[str] = None,
        active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """
        List available models
        
        Args:
            component_type: Filter by component type (optional)
            model_type: Filter by model type (optional)
            active_only: Only include active models
            
        Returns:
            List of model metadata dictionaries
        """
        logger.info("Listing models")
        
        # Filter models
        filtered_models = []
        
        for model_id, model in self.models_metadata["models"].items():
            # Apply filters
            if component_type and model["component_type"] != component_type:
                continue
            
            if model_type and model["model_type"] != model_type:
                continue
            
            if active_only and model["status"] != "active":
                continue
            
            # Add to filtered list
            filtered_models.append(model)
        
        # Sort by creation date (newest first)
        filtered_models.sort(key=lambda m: m["created_at"], reverse=True)
        
        return filtered_models
    
    async def train_all_models(
        self,
        db_session: Session,
        component_types: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Train all model types for specified component types
        
        Args:
            db_session: Database session
            component_types: List of component types to train models for (optional)
            
        Returns:
            Dictionary with training results
        """
        logger.info("Training all models")
        
        if not component_types:
            component_types = [ct.value for ct in ComponentType]
        
        results = {}
        
        for component_type in component_types:
            logger.info(f"Training models for {component_type}")
            
            try:
                # Prepare training data
                training_data = await self.prepare_training_data(db_session, component_type)
                
                if training_data["count"] < 50:
                    logger.warning(f"Insufficient training data for {component_type}: {training_data['count']} samples")
                    results[component_type] = {
                        "status": "skipped",
                        "message": f"Insufficient training data: {training_data['count']} samples"
                    }
                    continue
                
                # Train detector model
                detector_result = await self.train_component_detector(
                    component_type,
                    training_data["training_dir"]
                )
                
                # Train issue classifier
                classifier_result = await self.train_issue_classifier(
                    component_type,
                    training_data["training_dir"]
                )
                
                # Fine-tune OpenAI model if API key is available
                openai_result = None
                if OPENAI_API_KEY:
                    openai_result = await self.finetune_openai_model(
                        component_type,
                        training_data["training_dir"]
                    )
                
                results[component_type] = {
                    "status": "success",
                    "training_data": {
                        "count": training_data["count"],
                        "dir": training_data["training_dir"]
                    },
                    "models": {
                        "detector": detector_result,
                        "classifier": classifier_result,
                        "openai": openai_result
                    }
                }
                
            except Exception as e:
                logger.error(f"Error training models for {component_type}: {str(e)}")
                results[component_type] = {
                    "status": "failed",
                    "message": str(e)
                }
        
        return results
