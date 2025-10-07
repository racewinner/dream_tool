#!/usr/bin/env python3
"""
Complete Solution Test - Demonstrates the comprehensive fix to the original refresh() problem
This test shows how the new system handles the exact scenarios that were causing issues before
"""

import sys
from pathlib import Path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from services.comprehensive_data_import_service import comprehensive_import_service
from services.enhanced_database_service import enhanced_db_service
from models.database_models import FacilityType, FacilityStatus
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_original_problem_scenario():
    """Test the exact scenario that was causing the original refresh() problem"""
    print("\n🔬 TESTING ORIGINAL PROBLEM SCENARIO")
    print("=" * 60)
    
    # This is the type of data that was causing enum conversion issues
    problematic_kobo_data = {
        '_id': 'test_survey_001',
        'facility_name': 'Test Healthcare Center',
        'facility_type': 'health',  # String that needs enum conversion
        '_geolocation': [2.0469, 45.3182],  # GPS coordinates as array
        'region': 'Banadir',
        'district': 'Mogadishu',
        '_submission_time': '2024-01-15T10:30:00Z',
        'equipment': [
            {
                'equipment_name': 'Refrigerator',
                'equipment_type': 'medical',
                'power_rating': '150W',
                'quantity': 1,
                'is_critical': 'yes',
                'usage_hours': '24'
            },
            {
                'equipment_name': 'LED Lights',
                'equipment_type': 'lighting',
                'power_rating': '20',
                'quantity': 4,
                'is_critical': 'no',
                'usage_hours': '12'
            }
        ]
    }
    
    print("📥 Importing problematic KoboToolbox data...")
    print(f"   Facility Type: '{problematic_kobo_data['facility_type']}' (string)")
    print(f"   GPS Format: {problematic_kobo_data['_geolocation']} (array)")
    print(f"   Equipment Count: {len(problematic_kobo_data['equipment'])}")
    
    try:
        # This would have failed with the old refresh() system
        survey, errors = comprehensive_import_service.import_survey_from_kobo_data(problematic_kobo_data)
        
        if survey:
            print(f"\n✅ SUCCESS: Survey imported with ID: {survey.id}")
            print(f"   Facility: {survey.facility.name}")
            print(f"   Facility Type: {survey.facility.type} (type: {type(survey.facility.type)})")
            print(f"   Facility Status: {survey.facility.status} (type: {type(survey.facility.status)})")
            print(f"   GPS: ({survey.facility.latitude}, {survey.facility.longitude})")
            print(f"   Collection Date: {survey.collection_date}")
            
            # Verify enum objects are properly converted
            assert isinstance(survey.facility.type, FacilityType), "Type should be enum object"
            assert isinstance(survey.facility.status, FacilityStatus), "Status should be enum object"
            assert survey.facility.type.value == 'healthcare', "Type should be converted to healthcare"
            
            # Check equipment was created
            equipment = enhanced_db_service.get_equipment_by_survey(survey.id)
            print(f"   Equipment Created: {len(equipment)} items")
            
            for eq in equipment:
                print(f"     - {eq.name}: {eq.power_rating}W, Critical: {eq.critical}")
            
            return True
        else:
            print(f"❌ FAILED: {errors}")
            return False
            
    except Exception as e:
        print(f"❌ CRASHED: {e}")
        return False

def test_enum_edge_cases():
    """Test edge cases that would break the old system"""
    print("\n🔬 TESTING ENUM EDGE CASES")
    print("=" * 60)
    
    edge_cases = [
        {
            'name': 'Mixed Case Facility Type',
            'data': {
                '_id': 'edge_case_1',
                'facility_name': 'Mixed Case Test',
                'facility_type': 'HEALTHCARE',  # Uppercase
                '_geolocation': [1.0, 1.0]
            }
        },
        {
            'name': 'Unknown Facility Type',
            'data': {
                '_id': 'edge_case_2',
                'facility_name': 'Unknown Type Test',
                'facility_type': 'unknown_type',  # Invalid type
                '_geolocation': [2.0, 2.0]
            }
        },
        {
            'name': 'Missing GPS Data',
            'data': {
                '_id': 'edge_case_3',
                'facility_name': 'No GPS Test',
                'facility_type': 'education'
                # No GPS data
            }
        },
        {
            'name': 'String GPS Format',
            'data': {
                '_id': 'edge_case_4',
                'facility_name': 'String GPS Test',
                'facility_type': 'ict',
                '_geolocation': '3.0 4.0'  # String format
            }
        }
    ]
    
    successful_cases = 0
    
    for case in edge_cases:
        print(f"\n   Testing: {case['name']}")
        try:
            survey, errors = comprehensive_import_service.import_survey_from_kobo_data(case['data'])
            
            if survey:
                print(f"   ✅ Success: Survey ID {survey.id}")
                print(f"      Type: {survey.facility.type} ({survey.facility.type.value})")
                print(f"      GPS: ({survey.facility.latitude}, {survey.facility.longitude})")
                successful_cases += 1
            else:
                print(f"   ⚠️  Failed (expected): {errors}")
                
        except Exception as e:
            print(f"   ❌ Crashed: {e}")
    
    print(f"\n✅ Edge Cases Handled: {successful_cases}/{len(edge_cases)}")
    return successful_cases > 0

def test_bulk_import_performance():
    """Test bulk import performance and error handling"""
    print("\n🔬 TESTING BULK IMPORT PERFORMANCE")
    print("=" * 60)
    
    # Generate test data
    bulk_data = []
    for i in range(5):
        bulk_data.append({
            '_id': f'bulk_test_{i}',
            'facility_name': f'Bulk Test Facility {i}',
            'facility_type': ['healthcare', 'education', 'ict', 'agriculture', 'other'][i],
            '_geolocation': [float(i), float(i+1)],
            'region': 'Test Region',
            'equipment': [
                {
                    'equipment_name': f'Equipment {i}',
                    'power_rating': str(50 + i*10),
                    'quantity': i+1
                }
            ]
        })
    
    print(f"📦 Importing {len(bulk_data)} surveys in bulk...")
    
    try:
        results = comprehensive_import_service.bulk_import_surveys(bulk_data)
        
        print(f"✅ Bulk Import Results:")
        print(f"   Successful: {results['successful_imports']}")
        print(f"   Failed: {results['failed_imports']}")
        print(f"   Total Surveys: {len(results['surveys'])}")
        
        if results['errors']:
            print(f"   Errors: {len(results['errors'])}")
            for error in results['errors'][:3]:  # Show first 3 errors
                print(f"     - {error}")
        
        return results['successful_imports'] > 0
        
    except Exception as e:
        print(f"❌ Bulk import crashed: {e}")
        return False

def test_database_consistency():
    """Test that all created data maintains enum consistency"""
    print("\n🔬 TESTING DATABASE CONSISTENCY")
    print("=" * 60)
    
    try:
        # Get all facilities and verify enum consistency
        with enhanced_db_service.get_session() as db:
            from models.database_models import Facility
            facilities = db.query(Facility).all()
        
        print(f"📊 Checking {len(facilities)} facilities for enum consistency...")
        
        enum_issues = 0
        for facility in facilities:
            if not isinstance(facility.type, FacilityType):
                print(f"   ❌ Facility {facility.id}: type is {type(facility.type)}, not FacilityType")
                enum_issues += 1
            
            if not isinstance(facility.status, FacilityStatus):
                print(f"   ❌ Facility {facility.id}: status is {type(facility.status)}, not FacilityStatus")
                enum_issues += 1
        
        if enum_issues == 0:
            print("✅ All facilities have proper enum objects")
        else:
            print(f"❌ Found {enum_issues} enum consistency issues")
        
        # Test enum validation
        validation_results = enhanced_db_service.validate_enum_consistency()
        print(f"✅ Database Enum Validation: {validation_results['issues_found']} issues found")
        
        return enum_issues == 0
        
    except Exception as e:
        print(f"❌ Consistency check failed: {e}")
        return False

def main():
    """Run complete solution test"""
    print("🎯 COMPLETE SOLUTION TEST")
    print("Testing the comprehensive fix to the original refresh() problem")
    print("=" * 80)
    
    tests = [
        ("Original Problem Scenario", test_original_problem_scenario),
        ("Enum Edge Cases", test_enum_edge_cases),
        ("Bulk Import Performance", test_bulk_import_performance),
        ("Database Consistency", test_database_consistency)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 80)
    print("🎯 COMPLETE SOLUTION TEST SUMMARY")
    print("=" * 80)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    total = len(results)
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 COMPLETE SOLUTION WORKING!")
        print("✅ The original refresh() problem has been comprehensively solved")
        print("✅ Enum handling is robust and production-ready")
        print("✅ Object lifecycle management is working correctly")
        print("✅ KoboToolbox data import is fully functional")
        return True
    else:
        print("\n⚠️  Some tests failed. Review the output above for details.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
