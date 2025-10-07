"""
Solar Vision Service - AI-powered solar PV component analysis
"""

import os
import logging
import json
import aiohttp
import base64
from io import BytesIO
from typing import Dict, List, Any, Optional, Tuple
import requests
from PIL import Image, ImageDraw, ImageFont
import uuid

from models.solar_analysis_models import (
    SolarSystemAssessment, SolarComponentDetected, SystemCapacityAnalysis,
    DetectedIssue, UpgradeRecommendation, ComponentType, IssueSeverity
)
from core.database import get_db_session

logger = logging.getLogger(__name__)

class SolarVisionService:
    """
    AI-powered solar PV component analysis service
    Uses OpenAI Vision API to analyze solar system components
    """
    
    def __init__(self):
        """Initialize the service with API keys and configuration"""
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("VISION_MODEL", "gpt-4-vision-preview")
        self.storage_path = os.getenv("IMAGE_STORAGE_PATH", "storage/solar_images")
        
        # Ensure storage directory exists
        os.makedirs(self.storage_path, exist_ok=True)
    
    async def analyze_solar_panels(self, image_url: str) -> Dict[str, Any]:
        """
        Analyze solar panels in an image
        
        Args:
            image_url: URL of the image to analyze
            
        Returns:
            Dict containing analysis results
        """
        prompt = """Analyze this solar panel installation photo and provide:
        
1. Count the total number of solar panels visible
2. Assess the condition of the panels (excellent/good/fair/poor)
3. Identify if this is a rooftop or ground-mount installation
4. Detect any visible issues:
   - Dust or dirt accumulation
   - Physical damage or cracks
   - Discoloration
   - Shading from trees or buildings
   - Misalignment or poor mounting
5. Estimate the approximate size of individual panels if specifications are visible

Provide your response in this exact JSON format:
{
    "panel_count": <number>,
    "condition": "<excellent|good|fair|poor>",
    "mounting_type": "<rooftop|ground_mount|unknown>",
    "issues_detected": [
        {"issue": "<issue_name>", "severity": "<low|medium|high>", "description": "<details>"}
    ],
    "estimated_panel_watts": <number or null>,
    "confidence": <0.0-1.0>
}"""

        return await self._analyze_image(image_url, prompt)
    
    async def analyze_batteries(self, image_url: str) -> Dict[str, Any]:
        """
        Analyze battery bank in an image
        
        Args:
            image_url: URL of the image to analyze
            
        Returns:
            Dict containing analysis results
        """
        prompt = """Analyze this battery bank photo and provide:
        
1. Count the total number of batteries visible
2. Identify the wiring configuration:
   - Series (batteries connected end-to-end)
   - Parallel (batteries connected side-by-side)
   - Series-Parallel (combination of both)
3. Assess battery condition (excellent/good/fair/poor)
4. Detect any visible issues:
   - Terminal corrosion (white/green buildup)
   - Battery swelling or bulging
   - Leakage or stains
   - Loose connections
   - Missing terminal covers
   - Poor ventilation

Provide response in JSON format:
{
    "battery_count": <number>,
    "wiring_configuration": "<series|parallel|series_parallel|unknown>",
    "condition": "<excellent|good|fair|poor>",
    "issues_detected": [
        {"issue": "<issue_name>", "severity": "<low|medium|high|critical>", "description": "<details>"}
    ],
    "confidence": <0.0-1.0>
}"""

        return await self._analyze_image(image_url, prompt)
    
    async def analyze_inverter(self, image_url: str) -> Dict[str, Any]:
        """
        Analyze inverter in an image
        
        Args:
            image_url: URL of the image to analyze
            
        Returns:
            Dict containing analysis results
        """
        prompt = """Analyze this inverter photo and provide:
        
1. Confirm an inverter is present and visible
2. Assess installation quality:
   - Proper mounting (secure, level)
   - Adequate ventilation clearance
   - Cable management
   - Safety disconnects visible
3. Detect any visible issues:
   - Poor ventilation (too close to walls)
   - Loose or exposed wiring
   - Physical damage
   - Overheating signs (discoloration, melting)

Provide response in JSON format:
{
    "inverter_detected": <true|false>,
    "installation_quality": "<excellent|good|fair|poor>",
    "ventilation_adequate": <true|false>,
    "issues_detected": [
        {"issue": "<issue_name>", "severity": "<low|medium|high>", "description": "<details>"}
    ],
    "confidence": <0.0-1.0>
}"""

        return await self._analyze_image(image_url, prompt)
    
    async def analyze_mppt(self, image_url: str) -> Dict[str, Any]:
        """
        Analyze MPPT controller in an image
        
        Args:
            image_url: URL of the image to analyze
            
        Returns:
            Dict containing analysis results
        """
        prompt = """Analyze this MPPT charge controller photo and provide:
        
1. Confirm an MPPT controller is present and visible
2. Assess installation quality:
   - Proper mounting
   - Cable management
   - Display visibility
3. Detect any visible issues:
   - Overheating signs
   - Loose connections
   - Physical damage
   - Display errors or warnings

Provide response in JSON format:
{
    "mppt_detected": <true|false>,
    "installation_quality": "<excellent|good|fair|poor>",
    "issues_detected": [
        {"issue": "<issue_name>", "severity": "<low|medium|high>", "description": "<details>"}
    ],
    "confidence": <0.0-1.0>
}"""

        return await self._analyze_image(image_url, prompt)
    
    async def extract_specifications(self, image_url: str, component_type: str) -> Dict[str, Any]:
        """
        Extract specifications from equipment label
        
        Args:
            image_url: URL of the image to analyze
            component_type: Type of component (solar_panel, battery, inverter, mppt)
            
        Returns:
            Dict containing extracted specifications
        """
        if component_type == "solar_panel":
            prompt = """Extract the following specifications from this solar panel label:

1. Power rating (Watts): Look for values like "400W", "450 Watts", "Pmax"
2. Voltage (V): Look for "Voc", "Vmp", or voltage ratings
3. Current (A): Look for "Isc", "Imp", or current ratings
4. Brand/Manufacturer name
5. Model number
6. Efficiency percentage if visible

Provide response in JSON format:
{
    "wattage": <number or null>,
    "voltage": <number or null>,
    "current": <number or null>,
    "brand": "<brand_name or null>",
    "model": "<model_number or null>",
    "efficiency": <number or null>,
    "raw_text": "<all_visible_text>",
    "confidence": <0.0-1.0>
}"""
        
        elif component_type == "battery":
            prompt = """Extract the following specifications from this battery label:

1. Voltage: Look for "12V", "24V", "48V"
2. Amp-hour capacity: Look for "200Ah", "100 AH"
3. Battery type: Lead-Acid, AGM, Gel, Lithium, etc.
4. Brand/Manufacturer name
5. Model number

Provide response in JSON format:
{
    "voltage": <number or null>,
    "amp_hours": <number or null>,
    "battery_type": "<type or null>",
    "brand": "<brand_name or null>",
    "model": "<model_number or null>",
    "raw_text": "<all_visible_text>",
    "confidence": <0.0-1.0>
}"""
        
        elif component_type == "inverter":
            prompt = """Extract the following specifications from this inverter label:

1. Power rating: Look for "2000W", "3kW", "5000VA"
2. Input voltage (DC): Look for "24V", "48V"
3. Output voltage (AC): Look for "230V", "110V"
4. Inverter type: Pure Sine Wave, Modified Sine Wave, etc.
5. Brand/Manufacturer name
6. Model number

Provide response in JSON format:
{
    "power_rating_watts": <number or null>,
    "input_voltage": <number or null>,
    "output_voltage": <number or null>,
    "inverter_type": "<type or null>",
    "brand": "<brand_name or null>",
    "model": "<model_number or null>",
    "raw_text": "<all_visible_text>",
    "confidence": <0.0-1.0>
}"""
        
        else:
            prompt = """Extract all visible specifications from this equipment label.
Include brand, model, power ratings, and any other technical specifications visible.

Provide response in JSON format:
{
    "specifications": {
        "<spec_name>": "<value>",
        ...
    },
    "raw_text": "<all_visible_text>",
    "confidence": <0.0-1.0>
}"""
        
        return await self._analyze_image(image_url, prompt)
    
    async def _analyze_image(self, image_url: str, prompt: str) -> Dict[str, Any]:
        """
        Send image to OpenAI Vision API for analysis
        
        Args:
            image_url: URL of the image to analyze
            prompt: Prompt for the vision model
            
        Returns:
            Dict containing analysis results
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": prompt},
                                    {"type": "image_url", "image_url": {"url": image_url}}
                                ]
                            }
                        ],
                        "max_tokens": 1000,
                        "temperature": 0.2
                    }
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"OpenAI API error: {response.status} - {error_text}")
                        return {"error": f"API error: {response.status}", "confidence": 0.0}
                    
                    result = await response.json()
                    
                    # Extract JSON from response
                    content = result["choices"][0]["message"]["content"]
                    
                    # Parse JSON from content
                    try:
                        # Find JSON content (it might be wrapped in markdown code blocks)
                        if "```json" in content:
                            json_str = content.split("```json")[1].split("```")[0].strip()
                        elif "```" in content:
                            json_str = content.split("```")[1].strip()
                        else:
                            json_str = content.strip()
                        
                        analysis_result = json.loads(json_str)
                        return analysis_result
                    except Exception as e:
                        logger.error(f"Error parsing JSON response: {str(e)}")
                        logger.debug(f"Raw content: {content}")
                        return {"error": f"JSON parsing error: {str(e)}", "confidence": 0.0}
        
        except Exception as e:
            logger.error(f"Error analyzing image: {str(e)}")
            return {"error": str(e), "confidence": 0.0}
    
    async def process_assessment(self, assessment_id: str) -> Dict[str, Any]:
        """
        Process a complete solar system assessment
        
        Args:
            assessment_id: ID of the assessment to process
            
        Returns:
            Dict containing processing results
        """
        try:
            # Get assessment from database
            db_session = next(get_db_session())
            assessment = db_session.query(SolarSystemAssessment).filter(
                SolarSystemAssessment.id == assessment_id
            ).first()
            
            if not assessment:
                return {"error": f"Assessment not found: {assessment_id}"}
            
            # Update status to processing
            assessment.analysis_status = "processing"
            db_session.commit()
            
            # Get components
            components = db_session.query(SolarComponentDetected).filter(
                SolarComponentDetected.assessment_id == assessment_id
            ).all()
            
            if not components:
                assessment.analysis_status = "failed"
                db_session.commit()
                return {"error": "No components found for analysis"}
            
            # Process each component
            results = {}
            issues = []
            
            for component in components:
                if component.component_type == ComponentType.SOLAR_PANEL:
                    analysis = await self.analyze_solar_panels(component.photo_url)
                    component.analysis_results = analysis
                    component.detection_confidence = analysis.get("confidence", 0.0)
                    results["solar_panels"] = analysis
                    
                    # Extract issues
                    for issue in analysis.get("issues_detected", []):
                        issues.append({
                            "component_type": ComponentType.SOLAR_PANEL,
                            "issue_type": issue.get("issue"),
                            "severity": issue.get("severity", "medium"),
                            "description": issue.get("description"),
                            "confidence_score": analysis.get("confidence", 0.0)
                        })
                
                elif component.component_type == ComponentType.BATTERY:
                    analysis = await self.analyze_batteries(component.photo_url)
                    component.analysis_results = analysis
                    component.detection_confidence = analysis.get("confidence", 0.0)
                    results["batteries"] = analysis
                    
                    # Extract issues
                    for issue in analysis.get("issues_detected", []):
                        issues.append({
                            "component_type": ComponentType.BATTERY,
                            "issue_type": issue.get("issue"),
                            "severity": issue.get("severity", "medium"),
                            "description": issue.get("description"),
                            "confidence_score": analysis.get("confidence", 0.0)
                        })
                
                elif component.component_type == ComponentType.INVERTER:
                    analysis = await self.analyze_inverter(component.photo_url)
                    component.analysis_results = analysis
                    component.detection_confidence = analysis.get("confidence", 0.0)
                    results["inverter"] = analysis
                    
                    # Extract issues
                    for issue in analysis.get("issues_detected", []):
                        issues.append({
                            "component_type": ComponentType.INVERTER,
                            "issue_type": issue.get("issue"),
                            "severity": issue.get("severity", "medium"),
                            "description": issue.get("description"),
                            "confidence_score": analysis.get("confidence", 0.0)
                        })
                
                elif component.component_type == ComponentType.MPPT:
                    analysis = await self.analyze_mppt(component.photo_url)
                    component.analysis_results = analysis
                    component.detection_confidence = analysis.get("confidence", 0.0)
                    results["mppt"] = analysis
                    
                    # Extract issues
                    for issue in analysis.get("issues_detected", []):
                        issues.append({
                            "component_type": ComponentType.MPPT,
                            "issue_type": issue.get("issue"),
                            "severity": issue.get("severity", "medium"),
                            "description": issue.get("description"),
                            "confidence_score": analysis.get("confidence", 0.0)
                        })
            
            # Save component analysis results
            db_session.commit()
            
            # Calculate system capacity
            capacity = self._calculate_system_capacity(results)
            
            # Create capacity analysis record
            capacity_analysis = SystemCapacityAnalysis(
                assessment_id=assessment_id,
                solar_capacity_kw=capacity.get("solar_capacity_kw"),
                panel_count=capacity.get("panel_count"),
                individual_panel_watts=capacity.get("individual_panel_watts"),
                battery_capacity_kwh=capacity.get("battery_capacity_kwh"),
                battery_count=capacity.get("battery_count"),
                battery_voltage=capacity.get("battery_voltage"),
                battery_ah=capacity.get("battery_ah"),
                inverter_capacity_kw=capacity.get("inverter_capacity_kw"),
                inverter_type=capacity.get("inverter_type"),
                mppt_capacity_kw=capacity.get("mppt_capacity_kw"),
                estimated_backup_hours=capacity.get("estimated_backup_hours"),
                system_balance_status=capacity.get("system_balance_status", "unknown")
            )
            db_session.add(capacity_analysis)
            
            # Create issue records
            for issue_data in issues:
                issue = DetectedIssue(
                    assessment_id=assessment_id,
                    component_type=issue_data["component_type"],
                    issue_type=issue_data["issue_type"],
                    severity=issue_data["severity"],
                    description=issue_data["description"],
                    confidence_score=issue_data["confidence_score"]
                )
                db_session.add(issue)
            
            # Generate upgrade recommendations
            recommendations = self._generate_recommendations(capacity, issues)
            
            for rec_data in recommendations:
                recommendation = UpgradeRecommendation(
                    assessment_id=assessment_id,
                    recommendation_type=rec_data["recommendation_type"],
                    priority=rec_data["priority"],
                    title=rec_data["title"],
                    description=rec_data["description"],
                    current_value=rec_data.get("current_value"),
                    recommended_value=rec_data.get("recommended_value"),
                    estimated_cost_usd=rec_data.get("estimated_cost_usd"),
                    estimated_annual_savings_usd=rec_data.get("estimated_annual_savings_usd"),
                    payback_period_months=rec_data.get("payback_period_months"),
                    implementation_notes=rec_data.get("implementation_notes")
                )
                db_session.add(recommendation)
            
            # Update assessment status and confidence
            assessment.analysis_status = "completed"
            assessment.overall_confidence_score = self._calculate_overall_confidence(results)
            db_session.commit()
            
            return {
                "status": "success",
                "assessment_id": assessment_id,
                "components_analyzed": len(components),
                "issues_found": len(issues),
                "recommendations_generated": len(recommendations)
            }
            
        except Exception as e:
            logger.error(f"Error processing assessment: {str(e)}")
            
            # Update assessment status to failed
            try:
                db_session = next(get_db_session())
                assessment = db_session.query(SolarSystemAssessment).filter(
                    SolarSystemAssessment.id == assessment_id
                ).first()
                
                if assessment:
                    assessment.analysis_status = "failed"
                    db_session.commit()
            except Exception:
                pass
            
            return {"error": str(e)}
    
    def _calculate_system_capacity(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate system capacity from component analysis results
        
        Args:
            results: Dict containing component analysis results
            
        Returns:
            Dict containing calculated system capacity
        """
        capacity = {}
        
        # Calculate solar capacity
        solar_panels = results.get("solar_panels", {})
        panel_count = solar_panels.get("panel_count", 0)
        panel_watts = solar_panels.get("estimated_panel_watts")
        
        if panel_count and panel_watts:
            capacity["solar_capacity_kw"] = (panel_count * panel_watts) / 1000
            capacity["panel_count"] = panel_count
            capacity["individual_panel_watts"] = panel_watts
        
        # Calculate battery capacity
        batteries = results.get("batteries", {})
        battery_count = batteries.get("battery_count", 0)
        
        # Assume 12V 100Ah batteries if not specified
        battery_voltage = 12
        battery_ah = 100
        
        if battery_count:
            capacity["battery_count"] = battery_count
            capacity["battery_voltage"] = battery_voltage
            capacity["battery_ah"] = battery_ah
            
            # Calculate kWh capacity based on configuration
            wiring = batteries.get("wiring_configuration", "unknown")
            
            if wiring == "series":
                capacity["battery_capacity_kwh"] = (battery_count * battery_voltage * battery_ah) / 1000
            elif wiring == "parallel":
                capacity["battery_capacity_kwh"] = (battery_voltage * battery_ah * battery_count) / 1000
            else:  # series-parallel or unknown
                capacity["battery_capacity_kwh"] = (battery_voltage * battery_ah * battery_count) / 1000
        
        # Calculate inverter capacity
        inverter = results.get("inverter", {})
        if inverter.get("inverter_detected", False):
            # Estimate inverter capacity based on solar capacity
            if "solar_capacity_kw" in capacity:
                capacity["inverter_capacity_kw"] = capacity["solar_capacity_kw"] * 0.8  # Estimate
            else:
                capacity["inverter_capacity_kw"] = 2.0  # Default estimate
            
            capacity["inverter_type"] = "Unknown"
        
        # Calculate MPPT capacity
        mppt = results.get("mppt", {})
        if mppt.get("mppt_detected", False):
            # Estimate MPPT capacity based on solar capacity
            if "solar_capacity_kw" in capacity:
                capacity["mppt_capacity_kw"] = capacity["solar_capacity_kw"] * 1.2  # Estimate
        
        # Calculate estimated backup hours
        if "battery_capacity_kwh" in capacity and "solar_capacity_kw" in capacity:
            # Rough estimate: battery capacity / (solar capacity * 0.2)
            # Assumes 20% of solar capacity as average load
            capacity["estimated_backup_hours"] = capacity["battery_capacity_kwh"] / (capacity["solar_capacity_kw"] * 0.2)
        
        # Determine system balance status
        capacity["system_balance_status"] = self._determine_balance_status(capacity)
        
        return capacity
    
    def _determine_balance_status(self, capacity: Dict[str, Any]) -> str:
        """
        Determine if the system components are properly balanced
        
        Args:
            capacity: Dict containing calculated system capacity
            
        Returns:
            String indicating balance status
        """
        if not all(k in capacity for k in ["solar_capacity_kw", "inverter_capacity_kw"]):
            return "incomplete_data"
        
        solar_kw = capacity["solar_capacity_kw"]
        inverter_kw = capacity["inverter_capacity_kw"]
        
        inverter_ratio = inverter_kw / solar_kw if solar_kw else 0
        
        if 0.8 <= inverter_ratio <= 1.2:
            return "well_balanced"
        elif inverter_ratio < 0.8:
            return "inverter_undersized"
        else:
            return "inverter_oversized"
    
    def _generate_recommendations(
        self, 
        capacity: Dict[str, Any], 
        issues: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Generate upgrade recommendations based on capacity and issues
        
        Args:
            capacity: Dict containing calculated system capacity
            issues: List of detected issues
            
        Returns:
            List of upgrade recommendations
        """
        recommendations = []
        
        # Check system balance
        balance_status = capacity.get("system_balance_status")
        if balance_status == "inverter_undersized":
            solar_kw = capacity.get("solar_capacity_kw", 0)
            inverter_kw = capacity.get("inverter_capacity_kw", 0)
            
            recommendations.append({
                "recommendation_type": "capacity_expansion",
                "priority": "high",
                "title": "Upgrade Inverter Capacity",
                "description": "The current inverter is undersized for the solar array, which may lead to clipping and reduced system efficiency.",
                "current_value": f"{inverter_kw:.1f} kW",
                "recommended_value": f"{solar_kw:.1f} kW",
                "estimated_cost_usd": solar_kw * 300,  # Rough estimate
                "estimated_annual_savings_usd": (solar_kw - inverter_kw) * 200,  # Rough estimate
                "payback_period_months": 18,
                "implementation_notes": "Replace the existing inverter with a model that matches the solar array capacity."
            })
        
        # Check battery capacity
        if "battery_capacity_kwh" in capacity and "solar_capacity_kw" in capacity:
            solar_kw = capacity.get("solar_capacity_kw", 0)
            battery_kwh = capacity.get("battery_capacity_kwh", 0)
            
            if battery_kwh < solar_kw * 4:  # Rule of thumb: 4 hours of storage
                recommendations.append({
                    "recommendation_type": "capacity_expansion",
                    "priority": "medium",
                    "title": "Expand Battery Storage",
                    "description": "The current battery capacity is insufficient for optimal energy storage.",
                    "current_value": f"{battery_kwh:.1f} kWh",
                    "recommended_value": f"{solar_kw * 4:.1f} kWh",
                    "estimated_cost_usd": (solar_kw * 4 - battery_kwh) * 400,  # Rough estimate
                    "estimated_annual_savings_usd": (solar_kw * 4 - battery_kwh) * 100,  # Rough estimate
                    "payback_period_months": 48,
                    "implementation_notes": "Add additional battery capacity to increase energy storage and backup duration."
                })
        
        # Generate recommendations from issues
        critical_issues = [i for i in issues if i["severity"] == "critical"]
        high_issues = [i for i in issues if i["severity"] == "high"]
        
        # Handle critical issues
        for issue in critical_issues:
            if issue["component_type"] == ComponentType.SOLAR_PANEL:
                recommendations.append({
                    "recommendation_type": "maintenance",
                    "priority": "critical",
                    "title": f"Repair Solar Panel Issue: {issue['issue_type']}",
                    "description": issue["description"],
                    "implementation_notes": "Contact a qualified solar technician immediately to address this critical issue."
                })
            elif issue["component_type"] == ComponentType.BATTERY:
                recommendations.append({
                    "recommendation_type": "replacement",
                    "priority": "critical",
                    "title": f"Replace Faulty Battery: {issue['issue_type']}",
                    "description": issue["description"],
                    "implementation_notes": "Replace affected batteries immediately to prevent system failure or safety hazards."
                })
            elif issue["component_type"] == ComponentType.INVERTER:
                recommendations.append({
                    "recommendation_type": "maintenance",
                    "priority": "critical",
                    "title": f"Repair Inverter Issue: {issue['issue_type']}",
                    "description": issue["description"],
                    "implementation_notes": "Contact a qualified technician to inspect and repair the inverter immediately."
                })
        
        # Handle high priority issues
        for issue in high_issues:
            if issue["component_type"] == ComponentType.SOLAR_PANEL and "dirt" in issue["issue_type"].lower():
                recommendations.append({
                    "recommendation_type": "maintenance",
                    "priority": "high",
                    "title": "Clean Solar Panels",
                    "description": "Solar panels have significant dirt or dust accumulation, reducing efficiency.",
                    "estimated_cost_usd": 150,
                    "estimated_annual_savings_usd": 200,
                    "payback_period_months": 9,
                    "implementation_notes": "Schedule professional cleaning or implement a regular cleaning routine."
                })
        
        return recommendations
    
    def _calculate_overall_confidence(self, results: Dict[str, Any]) -> float:
        """
        Calculate overall confidence score from component analysis results
        
        Args:
            results: Dict containing component analysis results
            
        Returns:
            Float representing overall confidence (0.0-1.0)
        """
        confidence_scores = []
        
        for component_type, analysis in results.items():
            if isinstance(analysis, dict) and "confidence" in analysis:
                confidence_scores.append(analysis["confidence"])
        
        if not confidence_scores:
            return 0.0
        
        return sum(confidence_scores) / len(confidence_scores)
