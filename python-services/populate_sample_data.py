#!/usr/bin/env python3
"""
Populate Sample Data Script
Imports sample survey data to test the enhanced database integration
"""

import asyncio
import json
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
import random

# Add current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from services.data_import_enhanced import enhanced_import_service
from core.database import test_connection

# Sample KoboToolbox survey data
SAMPLE_KOBO_SURVEYS = [
    {
        "_id": "kobo_001",
        "_submission_time": "2024-01-15T10:30:00Z",
        "_submitted_by": "surveyor_001",
        "facility_name": "Kaalmo MCH",
        "facility_type": "health_clinic",
        "region": "Bay",
        "district": "Baidoa",
        "_geolocation": [2.3456, 43.6543],
        "equipment": [
            {
                "name": "LED Lights",
                "power_rating": 15,
                "quantity": 8,
                "hours_per_day": 12,
                "hours_per_night": 0,
                "category": "lighting",
                "critical": True
            },
            {
                "name": "Refrigerator",
                "power_rating": 150,
                "quantity": 1,
                "hours_per_day": 24,
                "hours_per_night": 0,
                "category": "medical",
                "critical": True
            },
            {
                "name": "Computer",
                "power_rating": 65,
                "quantity": 2,
                "hours_per_day": 8,
                "hours_per_night": 0,
                "category": "office",
                "critical": False
            }
        ],
        "staff_count": 12,
        "patient_capacity": 50,
        "operational_hours": "24/7",
        "power_source": "solar_grid_hybrid"
    },
    {
        "_id": "kobo_002",
        "_submission_time": "2024-01-16T14:20:00Z",
        "_submitted_by": "surveyor_002",
        "facility_name": "Hobyo Hospital",
        "facility_type": "hospital",
        "region": "Mudug",
        "district": "Hobyo",
        "_geolocation": [5.3456, 48.5321],
        "equipment": [
            {
                "name": "X-Ray Machine",
                "power_rating": 2000,
                "quantity": 1,
                "hours_per_day": 6,
                "hours_per_night": 0,
                "category": "medical",
                "critical": True
            },
            {
                "name": "Ventilator",
                "power_rating": 400,
                "quantity": 3,
                "hours_per_day": 24,
                "hours_per_night": 0,
                "category": "medical",
                "critical": True
            },
            {
                "name": "LED Lights",
                "power_rating": 20,
                "quantity": 25,
                "hours_per_day": 14,
                "hours_per_night": 0,
                "category": "lighting",
                "critical": True
            },
            {
                "name": "Air Conditioning",
                "power_rating": 1500,
                "quantity": 4,
                "hours_per_day": 16,
                "hours_per_night": 0,
                "category": "hvac",
                "critical": False
            }
        ],
        "staff_count": 45,
        "patient_capacity": 120,
        "operational_hours": "24/7",
        "power_source": "grid_backup_generator"
    },
    {
        "_id": "kobo_003",
        "_submission_time": "2024-01-17T09:15:00Z",
        "_submitted_by": "surveyor_001",
        "facility_name": "Baidoa Health Center",
        "facility_type": "health_center",
        "region": "Bay",
        "district": "Baidoa",
        "_geolocation": [3.1234, 43.6789],
        "equipment": [
            {
                "name": "Ultrasound Machine",
                "power_rating": 300,
                "quantity": 1,
                "hours_per_day": 8,
                "hours_per_night": 0,
                "category": "medical",
                "critical": True
            },
            {
                "name": "Microscope",
                "power_rating": 50,
                "quantity": 2,
                "hours_per_day": 6,
                "hours_per_night": 0,
                "category": "medical",
                "critical": True
            },
            {
                "name": "Ceiling Fans",
                "power_rating": 75,
                "quantity": 6,
                "hours_per_day": 10,
                "hours_per_night": 0,
                "category": "hvac",
                "critical": False
            }
        ],
        "staff_count": 18,
        "patient_capacity": 80,
        "operational_hours": "8am-6pm",
        "power_source": "solar_only"
    },
    {
        "_id": "kobo_004",
        "_submission_time": "2024-01-18T11:45:00Z",
        "_submitted_by": "surveyor_003",
        "facility_name": "Galkayo Medical Clinic",
        "facility_type": "medical_clinic",
        "region": "Mudug",
        "district": "Galkayo",
        "_geolocation": [6.7890, 47.4321],
        "equipment": [
            {
                "name": "Dental Equipment",
                "power_rating": 800,
                "quantity": 1,
                "hours_per_day": 6,
                "hours_per_night": 0,
                "category": "medical",
                "critical": True
            },
            {
                "name": "Sterilizer",
                "power_rating": 1200,
                "quantity": 1,
                "hours_per_day": 4,
                "hours_per_night": 0,
                "category": "medical",
                "critical": True
            },
            {
                "name": "Water Pump",
                "power_rating": 500,
                "quantity": 1,
                "hours_per_day": 3,
                "hours_per_night": 0,
                "category": "infrastructure",
                "critical": True
            }
        ],
        "staff_count": 8,
        "patient_capacity": 30,
        "operational_hours": "9am-5pm",
        "power_source": "generator_only"
    },
    {
        "_id": "kobo_005",
        "_submission_time": "2024-01-19T16:30:00Z",
        "_submitted_by": "surveyor_002",
        "facility_name": "Mogadishu General Hospital",
        "facility_type": "hospital",
        "region": "Banadir",
        "district": "Mogadishu",
        "_geolocation": [2.0469, 45.3182],
        "equipment": [
            {
                "name": "MRI Machine",
                "power_rating": 15000,
                "quantity": 1,
                "hours_per_day": 8,
                "hours_per_night": 0,
                "category": "medical",
                "critical": True
            },
            {
                "name": "CT Scanner",
                "power_rating": 8000,
                "quantity": 1,
                "hours_per_day": 10,
                "hours_per_night": 0,
                "category": "medical",
                "critical": True
            },
            {
                "name": "Laboratory Equipment",
                "power_rating": 2000,
                "quantity": 1,
                "hours_per_day": 16,
                "hours_per_night": 0,
                "category": "medical",
                "critical": True
            },
            {
                "name": "Emergency Lighting",
                "power_rating": 100,
                "quantity": 50,
                "hours_per_day": 24,
                "hours_per_night": 0,
                "category": "lighting",
                "critical": True
            }
        ],
        "staff_count": 150,
        "patient_capacity": 300,
        "operational_hours": "24/7",
        "power_source": "grid_solar_backup"
    },
    {
        "_id": "kobo_006",
        "_submission_time": "2024-01-20T13:10:00Z",
        "_submitted_by": "surveyor_001",
        "facility_name": "Hargeisa Maternity Ward",
        "facility_type": "maternity_ward",
        "region": "Woqooyi Galbeed",
        "district": "Hargeisa",
        "_geolocation": [9.5600, 44.0650],
        "equipment": [
            {
                "name": "Incubators",
                "power_rating": 400,
                "quantity": 6,
                "hours_per_day": 24,
                "hours_per_night": 0,
                "category": "medical",
                "critical": True
            },
            {
                "name": "Delivery Bed Lights",
                "power_rating": 150,
                "quantity": 8,
                "hours_per_day": 12,
                "hours_per_night": 0,
                "category": "medical",
                "critical": True
            },
            {
                "name": "Oxygen Concentrator",
                "power_rating": 350,
                "quantity": 4,
                "hours_per_day": 20,
                "hours_per_night": 0,
                "category": "medical",
                "critical": True
            }
        ],
        "staff_count": 25,
        "patient_capacity": 40,
        "operational_hours": "24/7",
        "power_source": "solar_battery_backup"
    }
]

async def populate_sample_data():
    """Populate database with sample survey data"""
    print("🔍 Testing database connection...")
    if not test_connection():
        print("❌ Database connection failed")
        return False
    
    print("✅ Database connection successful")
    print(f"📊 Importing {len(SAMPLE_KOBO_SURVEYS)} sample surveys...")
    
    try:
        # Import surveys one by one
        results = []
        for i, survey_data in enumerate(SAMPLE_KOBO_SURVEYS, 1):
            print(f"  Importing survey {i}/{len(SAMPLE_KOBO_SURVEYS)}: {survey_data['facility_name']}")
            
            result = await enhanced_import_service.import_kobo_survey(survey_data)
            results.append(result)
            
            if result.success:
                print(f"    ✅ Success - Survey ID: {result.survey_id}, Quality: {result.quality_score:.1f}")
            else:
                print(f"    ❌ Failed - {result.error}")
        
        # Summary
        successful = sum(1 for r in results if r.success)
        failed = len(results) - successful
        
        print(f"\n📈 Import Summary:")
        print(f"  ✅ Successful: {successful}")
        print(f"  ❌ Failed: {failed}")
        
        if successful > 0:
            quality_scores = [r.quality_score for r in results if r.success]
            avg_quality = sum(quality_scores) / len(quality_scores)
            print(f"  📊 Average Quality Score: {avg_quality:.1f}")
        
        return successful > 0
        
    except Exception as e:
        print(f"❌ Error during import: {str(e)}")
        return False

async def test_analysis_services():
    """Test the enhanced analysis services"""
    print("\n🔍 Testing analysis services...")
    
    try:
        # Get facility distribution
        print("  Testing facility distribution...")
        distribution = await enhanced_import_service.get_import_statistics()
        print(f"    Total surveys: {distribution.get('total_surveys', 0)}")
        print(f"    Total facilities: {distribution.get('total_facilities', 0)}")
        
        # Test batch analysis
        print("  Testing batch analysis...")
        from services.survey_analysis_enhanced import enhanced_analysis_service
        batch_result = await enhanced_analysis_service.analyze_batch_surveys()
        
        print(f"    Analyzed {batch_result.total_surveys} surveys")
        print(f"    Average data quality: {batch_result.avg_data_quality:.1f}")
        print(f"    Facility types: {batch_result.facility_type_distribution}")
        
        # Test single survey analysis
        if batch_result.total_surveys > 0:
            print("  Testing single survey analysis...")
            from services.database_service import db_service
            
            with db_service.get_session() as db:
                from models.database_models import Survey
                first_survey = db.query(Survey).first()
                
                if first_survey:
                    analysis_result = await enhanced_analysis_service.analyze_survey(first_survey.id)
                    print(f"    Survey {first_survey.id}: {analysis_result.facility_name}")
                    print(f"    Equipment count: {analysis_result.equipment_count}")
                    print(f"    Daily energy demand: {analysis_result.daily_energy_demand:.2f} kWh")
                    print(f"    Recommendations: {len(analysis_result.recommendations)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during analysis testing: {str(e)}")
        return False

def main():
    print("This is the main function of the script.")
    # Add your program's logic here
    result = 5 + 3
    print(f"The result is: {result}")

# async def main():
#     """Main function"""
#     print("=" * 60)
#     print("🐍 DREAM TOOL - Sample Data Population")
#     print("=" * 60)

#     import pdb; pdb.set_trace()  # or breakpoint() in Python 3.7+

#     # Step 1: Populate sample data
#     import_success = await populate_sample_data()
    
#     if not import_success:
#         print("\n❌ Sample data import failed")
#         return False
    
#     # Step 2: Test analysis services
#     analysis_success = await test_analysis_services()
    
#     if not analysis_success:
#         print("\n❌ Analysis services testing failed")
#         return False
    
#     print("\n" + "=" * 60)
#     print("🎉 SAMPLE DATA POPULATION COMPLETE!")
#     print("=" * 60)
#     print("✅ Database populated with sample survey data")
#     print("✅ Analysis services tested and working")
#     print("✅ Python services now use real database data")
#     print("\n🚀 Ready to test enhanced data import and analysis!")
    
#     return True

if __name__ == "__main__":
  print("This is the main function of the script.")
    # main()
    # success = asyncio.run(main())
    # sys.exit(0 if success else 1)
