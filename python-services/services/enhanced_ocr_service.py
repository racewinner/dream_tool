"""
Enhanced OCR Service for Solar PV Component Analysis
Extracts technical specifications from equipment labels and datasheets
"""

import os
import re
import json
import logging
import asyncio
from typing import Dict, Any, List, Optional, Tuple
import aiohttp
from PIL import Image
import pytesseract
from io import BytesIO
import numpy as np

logger = logging.getLogger(__name__)

# Load environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TESSERACT_CMD = os.getenv("TESSERACT_CMD", "tesseract")

# Set Tesseract path if specified
if TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

class EnhancedOCRService:
    """Service for enhanced OCR and specification extraction from solar equipment"""
    
    def __init__(self):
        """Initialize the OCR service with manufacturer database"""
        self.manufacturer_db_path = os.path.join(
            os.path.dirname(__file__), 
            "../data/solar_equipment_specs.json"
        )
        self.manufacturer_db = self._load_manufacturer_db()
        
        # Configure OCR settings for different component types
        self.ocr_configs = {
            "solar_panel": "--psm 4 --oem 3",  # Assume single column of text
            "battery": "--psm 6 --oem 3",      # Assume uniform block of text
            "inverter": "--psm 3 --oem 3",     # Assume mixed text
            "mppt": "--psm 6 --oem 3"          # Assume uniform block of text
        }
        
        # Regular expressions for extracting specifications
        self.regex_patterns = {
            "solar_panel": {
                "wattage": r"(\d+)\s*[Ww](atts?)?",
                "voltage": r"(\d+\.?\d*)\s*[Vv](olts?)?",
                "current": r"(\d+\.?\d*)\s*[Aa](mps?)?",
                "model": r"[Mm]odel\s*[:#]?\s*([A-Z0-9\-]+)",
                "dimensions": r"(\d+)\s*[xX]\s*(\d+)\s*[xX]?\s*(\d*)\s*mm",
                "efficiency": r"(\d+\.?\d*)\s*%\s*[Ee]ff(iciency)?",
            },
            "battery": {
                "voltage": r"(\d+\.?\d*)\s*[Vv](olts?)?",
                "capacity": r"(\d+\.?\d*)\s*[Aa][Hh]",
                "model": r"[Mm]odel\s*[:#]?\s*([A-Z0-9\-]+)",
                "type": r"(AGM|Gel|Lithium|LiFePO4|Lead[- ]Acid)",
                "cycles": r"(\d+)\s*[Cc]ycles?",
            },
            "inverter": {
                "power": r"(\d+\.?\d*)\s*[kK]?[Ww](atts?)?",
                "input_voltage": r"[Ii]nput\s*:?\s*(\d+\.?\d*)\s*[Vv]",
                "output_voltage": r"[Oo]utput\s*:?\s*(\d+\.?\d*)\s*[Vv]",
                "model": r"[Mm]odel\s*[:#]?\s*([A-Z0-9\-]+)",
                "efficiency": r"(\d+\.?\d*)\s*%\s*[Ee]ff(iciency)?",
            },
            "mppt": {
                "current": r"(\d+\.?\d*)\s*[Aa](mps?)?",
                "voltage": r"(\d+\.?\d*)\s*[Vv](olts?)?",
                "model": r"[Mm]odel\s*[:#]?\s*([A-Z0-9\-]+)",
                "max_pv": r"[Mm]ax\s*PV\s*:?\s*(\d+\.?\d*)\s*[Vv]",
            }
        }
    
    def _load_manufacturer_db(self) -> Dict[str, Any]:
        """Load manufacturer database from JSON file"""
        try:
            if os.path.exists(self.manufacturer_db_path):
                with open(self.manufacturer_db_path, 'r') as f:
                    return json.load(f)
            else:
                # Create empty database structure if file doesn't exist
                db = {
                    "solar_panels": {},
                    "batteries": {},
                    "inverters": {},
                    "mppt_controllers": {}
                }
                # Ensure directory exists
                os.makedirs(os.path.dirname(self.manufacturer_db_path), exist_ok=True)
                # Save empty database
                with open(self.manufacturer_db_path, 'w') as f:
                    json.dump(db, f, indent=2)
                return db
        except Exception as e:
            logger.error(f"Error loading manufacturer database: {str(e)}")
            return {
                "solar_panels": {},
                "batteries": {},
                "inverters": {},
                "mppt_controllers": {}
            }
    
    async def _download_image(self, image_url: str) -> Optional[Image.Image]:
        """Download image from URL and return as PIL Image"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(image_url) as response:
                    if response.status != 200:
                        logger.error(f"Failed to download image: {response.status}")
                        return None
                    
                    image_data = await response.read()
                    return Image.open(BytesIO(image_data))
        except Exception as e:
            logger.error(f"Error downloading image: {str(e)}")
            return None
    
    def _preprocess_image(self, image: Image.Image, component_type: str) -> Image.Image:
        """Preprocess image for better OCR results based on component type"""
        # Convert to grayscale
        image = image.convert('L')
        
        # Apply different preprocessing based on component type
        if component_type == "solar_panel":
            # Increase contrast for solar panel labels
            image = Image.fromarray(np.uint8(np.clip((np.array(image) * 1.5), 0, 255)))
        elif component_type == "battery":
            # Apply threshold for battery labels (often high contrast)
            image = image.point(lambda p: 0 if p < 128 else 255)
        elif component_type == "inverter" or component_type == "mppt":
            # Adaptive processing for electronic displays
            image = Image.fromarray(np.uint8(np.clip((np.array(image) * 1.3), 0, 255)))
        
        return image
    
    def _extract_text_with_tesseract(self, image: Image.Image, component_type: str) -> str:
        """Extract text from image using Tesseract OCR with component-specific config"""
        config = self.ocr_configs.get(component_type, "--psm 4 --oem 3")
        try:
            return pytesseract.image_to_string(image, config=config)
        except Exception as e:
            logger.error(f"Tesseract OCR error: {str(e)}")
            return ""
    
    async def _extract_text_with_openai(self, image_url: str) -> str:
        """Extract text from image using OpenAI Vision API"""
        if not OPENAI_API_KEY:
            logger.warning("OpenAI API key not set, skipping Vision API text extraction")
            return ""
        
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_API_KEY}"
            }
            
            payload = {
                "model": "gpt-4-vision-preview",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Extract all text visible in this image, especially focusing on specifications, model numbers, and technical details. Format as plain text."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_url
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": 300
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"OpenAI API error: {response.status} - {error_text}")
                        return ""
                    
                    result = await response.json()
                    return result["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"Error using OpenAI Vision API: {str(e)}")
            return ""
    
    def _parse_specifications(self, text: str, component_type: str) -> Dict[str, Any]:
        """Parse specifications from extracted text using regex patterns"""
        specs = {}
        
        # Get regex patterns for this component type
        patterns = self.regex_patterns.get(component_type, {})
        
        # Apply each pattern
        for spec_name, pattern in patterns.items():
            matches = re.search(pattern, text, re.IGNORECASE)
            if matches:
                # Get the first capturing group
                value = matches.group(1)
                
                # Convert to appropriate type if needed
                if spec_name in ["wattage", "power", "cycles"]:
                    try:
                        specs[spec_name] = int(value)
                    except ValueError:
                        specs[spec_name] = value
                elif spec_name in ["voltage", "current", "capacity", "efficiency"]:
                    try:
                        specs[spec_name] = float(value)
                    except ValueError:
                        specs[spec_name] = value
                else:
                    specs[spec_name] = value
        
        return specs
    
    def _match_manufacturer_specs(self, specs: Dict[str, Any], component_type: str) -> Dict[str, Any]:
        """Match extracted specs against manufacturer database for validation"""
        if not specs.get("model"):
            return specs
        
        # Map component type to database key
        db_key = {
            "solar_panel": "solar_panels",
            "battery": "batteries",
            "inverter": "inverters",
            "mppt": "mppt_controllers"
        }.get(component_type)
        
        if not db_key or db_key not in self.manufacturer_db:
            return specs
        
        # Look for exact model match
        model = specs["model"]
        if model in self.manufacturer_db[db_key]:
            # Get manufacturer specs
            mfg_specs = self.manufacturer_db[db_key][model]
            
            # Merge specs, preferring manufacturer data for missing values
            merged_specs = {**specs}
            for key, value in mfg_specs.items():
                if key not in merged_specs or merged_specs[key] is None:
                    merged_specs[key] = value
            
            # Add manufacturer name if available
            if "manufacturer" in mfg_specs:
                merged_specs["manufacturer"] = mfg_specs["manufacturer"]
            
            return merged_specs
        
        return specs
    
    def _validate_specs(self, specs: Dict[str, Any], component_type: str) -> Dict[str, Any]:
        """Validate extracted specifications for consistency and reasonable values"""
        validated = {**specs}
        
        if component_type == "solar_panel":
            # Validate solar panel specs
            if "wattage" in validated and validated["wattage"] > 1000:
                logger.warning(f"Suspicious solar panel wattage: {validated['wattage']}W")
                validated["wattage"] = None
            
            if "voltage" in validated and validated["voltage"] > 100:
                logger.warning(f"Suspicious solar panel voltage: {validated['voltage']}V")
                validated["voltage"] = None
        
        elif component_type == "battery":
            # Validate battery specs
            if "voltage" in validated and validated["voltage"] not in [2, 6, 12, 24, 48]:
                # Most common battery voltages
                closest = min([2, 6, 12, 24, 48], key=lambda x: abs(x - validated["voltage"]))
                if abs(closest - validated["voltage"]) < 2:  # Within 2V
                    logger.info(f"Correcting battery voltage from {validated['voltage']}V to {closest}V")
                    validated["voltage"] = closest
        
        elif component_type == "inverter":
            # Validate inverter specs
            if "power" in validated and validated["power"] > 50000:
                logger.warning(f"Suspicious inverter power: {validated['power']}W")
                validated["power"] = None
        
        return validated
    
    async def _update_manufacturer_db(self, specs: Dict[str, Any], component_type: str) -> None:
        """Update manufacturer database with new specifications"""
        if not specs.get("model"):
            return
        
        # Map component type to database key
        db_key = {
            "solar_panel": "solar_panels",
            "battery": "batteries",
            "inverter": "inverters",
            "mppt": "mppt_controllers"
        }.get(component_type)
        
        if not db_key or db_key not in self.manufacturer_db:
            return
        
        model = specs["model"]
        
        # Check if model exists in database
        if model not in self.manufacturer_db[db_key]:
            # Add new model
            self.manufacturer_db[db_key][model] = specs
            
            # Save updated database
            try:
                with open(self.manufacturer_db_path, 'w') as f:
                    json.dump(self.manufacturer_db, f, indent=2)
                logger.info(f"Added new {component_type} model to database: {model}")
            except Exception as e:
                logger.error(f"Error updating manufacturer database: {str(e)}")
    
    async def extract_specifications(self, image_url: str, component_type: str) -> Dict[str, Any]:
        """
        Extract specifications from an image of a solar component
        
        Args:
            image_url: URL of the image to analyze
            component_type: Type of component ('solar_panel', 'battery', 'inverter', 'mppt')
            
        Returns:
            Dictionary of extracted specifications
        """
        logger.info(f"Extracting specifications from {component_type} image")
        
        # Use both OCR methods in parallel for better results
        tesseract_text = ""
        openai_text = ""
        
        # Download and process image for Tesseract
        image = await self._download_image(image_url)
        if image:
            # Preprocess image
            processed_image = self._preprocess_image(image, component_type)
            
            # Extract text with Tesseract
            tesseract_text = self._extract_text_with_tesseract(processed_image, component_type)
        
        # Extract text with OpenAI Vision API in parallel
        if OPENAI_API_KEY:
            openai_text = await self._extract_text_with_openai(image_url)
        
        # Combine texts, with OpenAI results taking precedence
        combined_text = tesseract_text
        if openai_text:
            combined_text = f"{openai_text}\n{tesseract_text}"
        
        logger.debug(f"Extracted text: {combined_text[:100]}...")
        
        # Parse specifications
        specs = self._parse_specifications(combined_text, component_type)
        
        # Match against manufacturer database
        specs = self._match_manufacturer_specs(specs, component_type)
        
        # Validate specifications
        specs = self._validate_specs(specs, component_type)
        
        # Update manufacturer database with new specifications
        await self._update_manufacturer_db(specs, component_type)
        
        logger.info(f"Extracted specifications: {specs}")
        return specs
    
    async def extract_panel_specifications(self, image_url: str) -> Dict[str, Any]:
        """Extract specifications from a solar panel image"""
        return await self.extract_specifications(image_url, "solar_panel")
    
    async def extract_battery_specifications(self, image_url: str) -> Dict[str, Any]:
        """Extract specifications from a battery image"""
        return await self.extract_specifications(image_url, "battery")
    
    async def extract_inverter_specifications(self, image_url: str) -> Dict[str, Any]:
        """Extract specifications from an inverter image"""
        return await self.extract_specifications(image_url, "inverter")
    
    async def extract_mppt_specifications(self, image_url: str) -> Dict[str, Any]:
        """Extract specifications from an MPPT controller image"""
        return await self.extract_specifications(image_url, "mppt")
