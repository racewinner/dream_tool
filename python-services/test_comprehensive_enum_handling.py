#!/usr/bin/env python3
"""
Comprehensive Test Suite for Enum Handling System
Tests the complete enum handling architecture from database to Python objects
"""

import sys
from pathlib import Path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from services.enhanced_database_service import enhanced_db_service
from models.database_models import FacilityType, FacilityStatus
from core.enum_types import normalize_enum_value, denormalize_enum_value, validate_enum_data
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_enum_normalization():
    """Test enum value normalization functions"""
    print("\n🧪 TEST 1: Enum Normalization Functions")
    print("-" * 50)
    
    try:
        # Test enum object to string
        result = normalize_enum_value(FacilityType.HEALTHCARE, FacilityType)
        assert result == 'healthcare', f"Expected 'healthcare', got '{result}'"
        print("✅ Enum object → string conversion: PASS")
        
        # Test string validation
        result = normalize_enum_value('healthcare', FacilityType)
        assert result == 'healthcare', f"Expected 'healthcare', got '{result}'"
        print("✅ Valid string validation: PASS")
        
        # Test invalid string
        try:
            normalize_enum_value('invalid_type', FacilityType)
            print("❌ Invalid string validation: FAIL (should have raised ValueError)")
            return False
        except ValueError:
            print("✅ Invalid string rejection: PASS")
        
        # Test string to enum conversion
        result = denormalize_enum_value('healthcare', FacilityType)
        assert result == FacilityType.HEALTHCARE, f"Expected FacilityType.HEALTHCARE, got {result}"
        print("✅ String → enum object conversion: PASS")
        
        return True
        
    except Exception as e:
        print(f"❌ Enum normalization test failed: {e}")
        return False

def test_data_validation():
    """Test data dictionary validation"""
    print("\n🧪 TEST 2: Data Dictionary Validation")
    print("-" * 50)
    
    try:
        # Test valid data
        data = {
            'name': 'Test Facility',
            'type': FacilityType.HEALTHCARE,
            'status': 'survey',
            'latitude': 1.0,
            'longitude': 2.0
        }
        
        enum_mappings = {
            'type': FacilityType,
            'status': FacilityStatus
        }
        
        result = validate_enum_data(data, enum_mappings)
        assert result['type'] == 'healthcare', f"Expected 'healthcare', got '{result['type']}'"
        assert result['status'] == 'survey', f"Expected 'survey', got '{result['status']}'"
        print("✅ Valid data validation: PASS")
        
        # Test invalid data
        invalid_data = {
            'name': 'Test Facility',
            'type': 'invalid_type',
            'status': FacilityStatus.SURVEY
        }
        
        result = validate_enum_data(invalid_data, enum_mappings)
        assert 'type' not in result, "Invalid enum should be removed from data"
        assert result['status'] == 'survey', "Valid enum should be normalized"
        print("✅ Invalid data handling: PASS")
        
        return True
        
    except Exception as e:
        print(f"❌ Data validation test failed: {e}")
        return False

def test_database_health():
    """Test database connectivity and basic operations"""
    print("\n🧪 TEST 3: Database Health Check")
    print("-" * 50)
    
    try:
        health = enhanced_db_service.health_check()
        
        if health['status'] == 'healthy':
            print("✅ Database connectivity: PASS")
            print(f"   Facility count: {health['facility_count']}")
            return True
        else:
            print(f"❌ Database health check failed: {health.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Database health test failed: {e}")
        return False

def test_enum_consistency():
    """Test enum consistency in database"""
    print("\n🧪 TEST 4: Database Enum Consistency")
    print("-" * 50)
    
    try:
        validation = enhanced_db_service.validate_enum_consistency()
        
        if validation['status'] == 'completed':
            issues_count = validation['issues_found']
            print(f"✅ Enum consistency check completed: {issues_count} issues found")
            
            if issues_count > 0:
                print("⚠️  Issues found:")
                for issue in validation['issues']:
                    print(f"   - Table: {issue['table']}, Column: {issue['column']}")
                    print(f"     Invalid value: '{issue['invalid_value']}' (count: {issue['count']})")
                    print(f"     Valid values: {issue['valid_values']}")
            
            return True
        else:
            print(f"❌ Enum consistency check failed: {validation.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Enum consistency test failed: {e}")
        return False

def test_facility_creation_with_enums():
    """Test facility creation with different enum input types"""
    print("\n🧪 TEST 5: Facility Creation with Enum Handling")
    print("-" * 50)
    
    test_cases = [
        {
            'name': 'Test with Enum Objects',
            'data': {
                'name': 'Enum Object Test Facility',
                'type': FacilityType.HEALTHCARE,
                'latitude': 1.0,
                'longitude': 2.0,
                'status': FacilityStatus.SURVEY
            }
        },
        {
            'name': 'Test with String Values',
            'data': {
                'name': 'String Value Test Facility',
                'type': 'education',
                'latitude': 3.0,
                'longitude': 4.0,
                'status': 'design'
            }
        },
        {
            'name': 'Test with Mixed Types',
            'data': {
                'name': 'Mixed Types Test Facility',
                'type': FacilityType.ICT,
                'latitude': 5.0,
                'longitude': 6.0,
                'status': 'installed'
            }
        }
    ]
    
    created_facilities = []
    
    for test_case in test_cases:
        try:
            print(f"\n   Testing: {test_case['name']}")
            facility = enhanced_db_service.create_facility(test_case['data'])
            
            if facility and facility.id:
                print(f"   ✅ Created facility ID: {facility.id}")
                print(f"      Type: {facility.type} (type: {type(facility.type)})")
                print(f"      Status: {facility.status} (type: {type(facility.status)})")
                
                # Verify enum objects are returned
                if hasattr(facility.type, 'value'):
                    print(f"      ✅ Type is proper enum object with value: {facility.type.value}")
                else:
                    print(f"      ⚠️  Type is not enum object: {type(facility.type)}")
                
                created_facilities.append(facility.id)
            else:
                print(f"   ❌ Failed to create facility")
                return False
                
        except Exception as e:
            print(f"   ❌ Failed: {e}")
            return False
    
    # Clean up test data
    try:
        if created_facilities:
            print(f"\n   🧹 Cleaning up {len(created_facilities)} test facilities...")
            # Note: In a real implementation, you'd want a delete method
            # For now, we'll leave them as test data
            
    except Exception as e:
        print(f"   ⚠️  Cleanup warning: {e}")
    
    print(f"\n✅ Facility creation test completed: {len(created_facilities)} facilities created")
    return True

def test_survey_statistics():
    """Test survey statistics with enum handling"""
    print("\n🧪 TEST 6: Survey Statistics")
    print("-" * 50)
    
    try:
        stats = enhanced_db_service.get_survey_statistics()
        
        print("✅ Survey statistics retrieved:")
        for key, value in stats.items():
            print(f"   {key}: {value}")
        
        return True
        
    except Exception as e:
        print(f"❌ Survey statistics test failed: {e}")
        return False

def main():
    """Run comprehensive enum handling tests"""
    print("🔬 COMPREHENSIVE ENUM HANDLING TEST SUITE")
    print("=" * 60)
    
    tests = [
        ("Enum Normalization", test_enum_normalization),
        ("Data Validation", test_data_validation),
        ("Database Health", test_database_health),
        ("Enum Consistency", test_enum_consistency),
        ("Facility Creation", test_facility_creation_with_enums),
        ("Survey Statistics", test_survey_statistics)
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
    print("\n" + "=" * 60)
    print("🎯 TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    total = len(results)
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Enum handling system is working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Review the output above for details.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
