"""
Solar Report Service
Service for generating comprehensive reports for solar PV assessments
"""

import os
import logging
import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import uuid
import base64
from io import BytesIO
from pathlib import Path
import asyncio

from sqlalchemy.orm import Session
from sqlalchemy import desc
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, ListFlowable, ListItem
from reportlab.lib.units import inch, cm

from models.solar_analysis_models import (
    SolarSystemAssessment, SolarComponentDetected, ComponentType,
    DetectedIssue, UpgradeRecommendation
)
from models.solar_history_models import (
    MaintenanceAction, AssessmentHistory, ComponentHistory
)

logger = logging.getLogger(__name__)

# Configure report settings
REPORT_OUTPUT_DIR = os.getenv("REPORT_OUTPUT_DIR", "reports")
LOGO_PATH = os.getenv("LOGO_PATH", "static/logo.png")

class SolarReportService:
    """Service for generating comprehensive reports for solar PV assessments"""
    
    def __init__(self):
        """Initialize the report service"""
        # Create reports directory if it doesn't exist
        os.makedirs(REPORT_OUTPUT_DIR, exist_ok=True)
        
        # Initialize styles
        self.styles = getSampleStyleSheet()
        self._init_custom_styles()
    
    def _init_custom_styles(self):
        """Initialize custom styles for reports"""
        # Custom heading styles (using unique names)
        self.styles.add(ParagraphStyle(
            name='CustomHeading1',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=12
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomHeading2',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceAfter=10
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomHeading3',
            parent=self.styles['Heading3'],
            fontSize=14,
            spaceAfter=8
        ))
        
        # Body text styles
        self.styles.add(ParagraphStyle(
            name='CustomBodyText',
            parent=self.styles['BodyText'],
            fontSize=11,
            spaceAfter=6
        ))
        
        # Table styles
        self.table_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ])
    
    async def generate_assessment_report(
        self,
        db_session: Session,
        assessment_id: str,
        include_monitoring: bool = False,
        include_history: bool = False,
        output_format: str = "pdf"
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive report for a solar system assessment
        
        Args:
            db_session: Database session
            assessment_id: ID of the assessment
            include_monitoring: Whether to include monitoring data
            include_history: Whether to include historical data
            output_format: Output format (pdf, html, docx)
            
        Returns:
            Dictionary with report details and file path
        """
        logger.info(f"Generating report for assessment {assessment_id}")
        
        # Get assessment
        assessment = db_session.query(SolarSystemAssessment).filter_by(id=uuid.UUID(assessment_id)).first()
        if not assessment:
            raise ValueError(f"Assessment {assessment_id} not found")
        
        # Get components
        components = db_session.query(SolarComponentDetected).filter_by(assessment_id=uuid.UUID(assessment_id)).all()
        
        # Get issues
        issues = db_session.query(DetectedIssue).filter_by(assessment_id=uuid.UUID(assessment_id)).all()
        
        # Get recommendations
        recommendations = db_session.query(UpgradeRecommendation).filter_by(assessment_id=uuid.UUID(assessment_id)).all()
        
        # Get history if requested
        history = None
        if include_history:
            history = {
                "maintenance": db_session.query(MaintenanceAction).filter_by(facility_id=assessment.facility_id).order_by(desc(MaintenanceAction.action_date)).all(),
                "assessments": db_session.query(AssessmentHistory).filter_by(facility_id=assessment.facility_id).order_by(desc(AssessmentHistory.assessment_date)).all(),
                "components": db_session.query(ComponentHistory).filter_by(facility_id=assessment.facility_id).order_by(desc(ComponentHistory.recorded_date)).all()
            }
        
        # Generate report based on format
        if output_format.lower() == "pdf":
            report_path = await self._generate_pdf_report(assessment, components, issues, recommendations, history)
        else:
            # Default to PDF for now
            report_path = await self._generate_pdf_report(assessment, components, issues, recommendations, history)
        
        return {
            "assessment_id": assessment_id,
            "facility_id": assessment.facility_id,
            "facility_name": assessment.facility_name,
            "report_format": output_format,
            "report_path": report_path,
            "generated_at": datetime.now().isoformat(),
            "file_size_kb": os.path.getsize(report_path) / 1024
        }
    
    async def _generate_pdf_report(
        self,
        assessment: SolarSystemAssessment,
        components: List[SolarComponentDetected],
        issues: List[DetectedIssue],
        recommendations: List[UpgradeRecommendation],
        history: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate a PDF report for the assessment"""
        # Create filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"solar_assessment_{assessment.id}_{timestamp}.pdf"
        filepath = os.path.join(REPORT_OUTPUT_DIR, filename)
        
        # Create PDF document
        doc = SimpleDocTemplate(
            filepath,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        # Build content
        content = []
        
        # Add cover page
        self._add_cover_page(content, assessment)
        
        # Add executive summary
        self._add_executive_summary(content, assessment, components, issues, recommendations)
        
        # Add system overview
        self._add_system_overview(content, assessment, components)
        
        # Add components section
        self._add_components_section(content, components)
        
        # Add issues section
        self._add_issues_section(content, issues)
        
        # Add recommendations section
        self._add_recommendations_section(content, recommendations)
        
        # Add history section if requested
        if history:
            self._add_history_section(content, history)
        
        # Build the PDF
        doc.build(content)
        
        logger.info(f"PDF report generated: {filepath}")
        return filepath
    
    def _add_cover_page(self, content: List, assessment: SolarSystemAssessment):
        """Add cover page to the report"""
        # Add logo if available
        if os.path.exists(LOGO_PATH):
            logo = Image(LOGO_PATH)
            logo.drawHeight = 1.5 * inch
            logo.drawWidth = 1.5 * inch
            content.append(logo)
        
        # Add title
        content.append(Spacer(1, 2 * inch))
        content.append(Paragraph("Solar PV System Assessment Report", self.styles["Title"]))
        
        # Add facility info
        content.append(Spacer(1, 0.5 * inch))
        content.append(Paragraph(f"Facility: {assessment.facility_name}", self.styles["Heading2"]))
        content.append(Paragraph(f"Location: {assessment.location}", self.styles["Heading3"]))
        content.append(Paragraph(f"Assessment Date: {assessment.assessment_date.strftime('%B %d, %Y')}", self.styles["Heading3"]))
        
        # Add generated date
        content.append(Spacer(1, 2 * inch))
        content.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", self.styles["Normal"]))
        
        # Add page break
        content.append(PageBreak())
    
    def _add_executive_summary(
        self,
        content: List,
        assessment: SolarSystemAssessment,
        components: List[SolarComponentDetected],
        issues: List[DetectedIssue],
        recommendations: List[UpgradeRecommendation]
    ):
        """Add executive summary to the report"""
        content.append(Paragraph("Executive Summary", self.styles["Heading1"]))
        
        # System health summary
        health_status = "Good"
        if any(issue.severity == "critical" for issue in issues):
            health_status = "Critical"
        elif any(issue.severity == "high" for issue in issues):
            health_status = "Poor"
        elif any(issue.severity == "medium" for issue in issues):
            health_status = "Fair"
        
        summary_text = f"""
        This report provides a comprehensive assessment of the solar PV system at {assessment.facility_name}.
        The system was assessed on {assessment.assessment_date.strftime('%B %d, %Y')} and found to be in {health_status} condition.
        """
        
        content.append(Paragraph(summary_text, self.styles["BodyText"]))
        
        # Key findings
        content.append(Spacer(1, 0.2 * inch))
        content.append(Paragraph("Key Findings:", self.styles["Heading3"]))
        
        findings = [
            f"System Capacity: {assessment.capacity.solar_capacity_kw if assessment.capacity else 'Unknown'} kW",
            f"Components Assessed: {len(components)}",
            f"Issues Identified: {len(issues)}",
            f"Recommendations: {len(recommendations)}"
        ]
        
        for finding in findings:
            content.append(Paragraph(f"• {finding}", self.styles["BodyText"]))
        
        # Critical issues summary
        critical_issues = [issue for issue in issues if issue.severity in ["critical", "high"]]
        if critical_issues:
            content.append(Spacer(1, 0.2 * inch))
            content.append(Paragraph("Critical Issues:", self.styles["Heading3"]))
            
            for issue in critical_issues[:3]:  # Show top 3 critical issues
                content.append(Paragraph(f"• {issue.issue_type.replace('_', ' ').title()}: {issue.description}", self.styles["BodyText"]))
            
            if len(critical_issues) > 3:
                content.append(Paragraph(f"• Plus {len(critical_issues) - 3} more critical issues detailed in the Issues section", self.styles["BodyText"]))
        
        # Add page break
        content.append(PageBreak())
    
    def _add_system_overview(
        self,
        content: List,
        assessment: SolarSystemAssessment,
        components: List[SolarComponentDetected]
    ):
        """Add system overview to the report"""
        content.append(Paragraph("System Overview", self.styles["Heading1"]))
        
        # System details
        content.append(Paragraph("System Details", self.styles["Heading2"]))
        
        # Create system details table
        system_data = [
            ["Parameter", "Value"],
            ["Facility Name", assessment.facility_name],
            ["Location", assessment.location],
            ["Assessment Date", assessment.assessment_date.strftime("%B %d, %Y")],
            ["System Type", assessment.system_type if assessment.system_type else "Unknown"],
            ["Installation Date", assessment.installation_date.strftime("%B %d, %Y") if assessment.installation_date else "Unknown"],
            ["Solar Capacity", f"{assessment.capacity.solar_capacity_kw} kW" if assessment.capacity and assessment.capacity.solar_capacity_kw else "Unknown"],
            ["Battery Capacity", f"{assessment.capacity.battery_capacity_kwh} kWh" if assessment.capacity and assessment.capacity.battery_capacity_kwh else "Unknown"],
            ["Inverter Capacity", f"{assessment.capacity.inverter_capacity_kw} kW" if assessment.capacity and assessment.capacity.inverter_capacity_kw else "Unknown"],
            ["System Age", f"{assessment.system_age_years} years" if assessment.system_age_years else "Unknown"],
            ["Overall Condition", assessment.overall_condition if assessment.overall_condition else "Unknown"]
        ]
        
        system_table = Table(system_data, colWidths=[2.5 * inch, 3 * inch])
        system_table.setStyle(self.table_style)
        content.append(system_table)
        
        # Component summary
        content.append(Spacer(1, 0.3 * inch))
        content.append(Paragraph("Component Summary", self.styles["Heading2"]))
        
        # Group components by type
        component_counts = {}
        for component in components:
            component_type = component.component_type
            if component_type not in component_counts:
                component_counts[component_type] = 0
            component_counts[component_type] += 1
        
        # Create component summary table
        component_data = [["Component Type", "Count"]]
        for component_type, count in component_counts.items():
            component_data.append([component_type.replace("_", " ").title(), count])
        
        component_table = Table(component_data, colWidths=[3 * inch, 2.5 * inch])
        component_table.setStyle(self.table_style)
        content.append(component_table)
        
        # Add system diagram or image if available
        if assessment.system_diagram_url:
            content.append(Spacer(1, 0.3 * inch))
            content.append(Paragraph("System Diagram", self.styles["Heading2"]))
            try:
                img = Image(assessment.system_diagram_url)
                img.drawHeight = 3 * inch
                img.drawWidth = 5 * inch
                content.append(img)
            except Exception as e:
                logger.error(f"Error loading system diagram: {str(e)}")
                content.append(Paragraph("System diagram could not be loaded", self.styles["BodyText"]))
        
        # Add page break
        content.append(PageBreak())
    
    def _add_components_section(self, content: List, components: List[SolarComponentDetected]):
        """Add components section to the report"""
        content.append(Paragraph("Components Assessment", self.styles["Heading1"]))
        
        # Group components by type
        components_by_type = {}
        for component in components:
            component_type = component.component_type
            if component_type not in components_by_type:
                components_by_type[component_type] = []
            components_by_type[component_type].append(component)
        
        # Add each component type
        for component_type, type_components in components_by_type.items():
            content.append(Paragraph(f"{component_type.replace('_', ' ').title()} Components", self.styles["Heading2"]))
            
            # Create component table
            component_data = [["ID", "Manufacturer", "Model", "Condition", "Age (Years)"]]
            
            for component in type_components:
                component_data.append([
                    str(component.id)[-8:],  # Short ID
                    component.manufacturer or "Unknown",
                    component.model or "Unknown",
                    component.condition or "Unknown",
                    str(component.age_years) if component.age_years else "Unknown"
                ])
            
            component_table = Table(component_data, colWidths=[0.8 * inch, 1.5 * inch, 1.5 * inch, 1 * inch, 1 * inch])
            component_table.setStyle(self.table_style)
            content.append(component_table)
            
            # Add spacer between component types
            content.append(Spacer(1, 0.3 * inch))
        
        # Add page break
        content.append(PageBreak())
    
    def _add_issues_section(self, content: List, issues: List[DetectedIssue]):
        """Add issues section to the report"""
        content.append(Paragraph("Identified Issues", self.styles["Heading1"]))
        
        if not issues:
            content.append(Paragraph("No issues were identified in this assessment.", self.styles["BodyText"]))
            content.append(PageBreak())
            return
        
        # Group issues by severity
        issues_by_severity = {
            "critical": [],
            "high": [],
            "medium": [],
            "low": []
        }
        
        for issue in issues:
            severity = issue.severity.lower()
            if severity in issues_by_severity:
                issues_by_severity[severity].append(issue)
        
        # Add each severity group
        for severity, severity_issues in issues_by_severity.items():
            if not severity_issues:
                continue
                
            content.append(Paragraph(f"{severity.title()} Severity Issues", self.styles["Heading2"]))
            
            # Create issues table
            issue_data = [["Issue Type", "Component", "Description", "Confidence"]]
            
            for issue in severity_issues:
                issue_data.append([
                    issue.issue_type.replace("_", " ").title(),
                    issue.component_type.replace("_", " ").title(),
                    issue.description,
                    f"{int(issue.confidence_score * 100)}%"
                ])
            
            issue_table = Table(issue_data, colWidths=[1.5 * inch, 1.5 * inch, 2.5 * inch, 0.8 * inch])
            issue_table.setStyle(self.table_style)
            content.append(issue_table)
            
            # Add spacer between severity groups
            content.append(Spacer(1, 0.3 * inch))
        
        # Add page break
        content.append(PageBreak())
    
    def _add_recommendations_section(self, content: List, recommendations: List[UpgradeRecommendation]):
        """Add recommendations section to the report"""
        content.append(Paragraph("Recommendations", self.styles["Heading1"]))
        
        if not recommendations:
            content.append(Paragraph("No recommendations were provided in this assessment.", self.styles["BodyText"]))
            content.append(PageBreak())
            return
        
        # Group recommendations by priority
        recommendations_by_priority = {
            "high": [],
            "medium": [],
            "low": []
        }
        
        for recommendation in recommendations:
            priority = recommendation.priority.lower()
            if priority in recommendations_by_priority:
                recommendations_by_priority[priority].append(recommendation)
        
        # Add each priority group
        for priority, priority_recommendations in recommendations_by_priority.items():
            if not priority_recommendations:
                continue
                
            content.append(Paragraph(f"{priority.title()} Priority Recommendations", self.styles["Heading2"]))
            
            # Create recommendations table
            recommendation_data = [["Recommendation", "Component", "Description", "Estimated Cost"]]
            
            for recommendation in priority_recommendations:
                recommendation_data.append([
                    recommendation.recommendation_type.replace("_", " ").title(),
                    recommendation.component_type.replace("_", " ").title(),
                    recommendation.description,
                    f"${recommendation.estimated_cost}" if recommendation.estimated_cost else "Unknown"
                ])
            
            recommendation_table = Table(recommendation_data, colWidths=[1.5 * inch, 1.5 * inch, 2.5 * inch, 1 * inch])
            recommendation_table.setStyle(self.table_style)
            content.append(recommendation_table)
            
            # Add spacer between priority groups
            content.append(Spacer(1, 0.3 * inch))
        
        # Add page break
        content.append(PageBreak())
    
    def _add_history_section(self, content: List, history: Dict[str, Any]):
        """Add history section to the report"""
        content.append(Paragraph("System History", self.styles["Heading1"]))
        
        # Add maintenance history
        maintenance_actions = history.get("maintenance", [])
        if maintenance_actions:
            content.append(Paragraph("Maintenance History", self.styles["Heading2"]))
            
            # Create maintenance table
            maintenance_data = [["Date", "Action Type", "Components", "Performed By"]]
            
            for action in maintenance_actions[:10]:  # Show last 10 actions
                maintenance_data.append([
                    action.action_date.strftime("%Y-%m-%d"),
                    action.action_type.replace("_", " ").title(),
                    action.components_affected,
                    action.performed_by
                ])
            
            maintenance_table = Table(maintenance_data, colWidths=[1 * inch, 1.5 * inch, 2.5 * inch, 1.5 * inch])
            maintenance_table.setStyle(self.table_style)
            content.append(maintenance_table)
            
            # Add spacer
            content.append(Spacer(1, 0.3 * inch))
        
        # Add assessment history
        assessment_history = history.get("assessments", [])
        if assessment_history:
            content.append(Paragraph("Assessment History", self.styles["Heading2"]))
            
            # Create assessment history table
            assessment_data = [["Date", "Condition", "Issues", "Assessor"]]
            
            for assessment in assessment_history[:10]:  # Show last 10 assessments
                assessment_data.append([
                    assessment.assessment_date.strftime("%Y-%m-%d"),
                    assessment.overall_condition,
                    str(assessment.issues_count),
                    assessment.assessed_by
                ])
            
            assessment_table = Table(assessment_data, colWidths=[1 * inch, 1.5 * inch, 1 * inch, 2 * inch])
            assessment_table.setStyle(self.table_style)
            content.append(assessment_table)
        
        # Add page break
        content.append(PageBreak())
    
    async def get_report_list(
        self,
        facility_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get a list of generated reports
        
        Args:
            facility_id: Optional facility ID to filter by
            limit: Maximum number of reports to return
            offset: Offset for pagination
            
        Returns:
            List of report metadata
        """
        reports = []
        
        # Get all PDF files in the reports directory
        report_files = [f for f in os.listdir(REPORT_OUTPUT_DIR) if f.endswith('.pdf')]
        report_files.sort(key=lambda x: os.path.getmtime(os.path.join(REPORT_OUTPUT_DIR, x)), reverse=True)
        
        # Apply pagination
        report_files = report_files[offset:offset + limit]
        
        # Extract metadata from filenames
        for filename in report_files:
            try:
                # Parse assessment ID from filename
                parts = filename.split('_')
                if len(parts) >= 3:
                    assessment_id = parts[2]
                    
                    # Get file stats
                    filepath = os.path.join(REPORT_OUTPUT_DIR, filename)
                    file_size = os.path.getsize(filepath)
                    created_date = datetime.fromtimestamp(os.path.getctime(filepath))
                    
                    # Add to reports list
                    reports.append({
                        "filename": filename,
                        "assessment_id": assessment_id,
                        "file_path": filepath,
                        "file_size_kb": file_size / 1024,
                        "created_at": created_date.isoformat(),
                        "format": "pdf"
                    })
            except Exception as e:
                logger.error(f"Error parsing report metadata from {filename}: {str(e)}")
        
        return reports
