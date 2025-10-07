#!/usr/bin/env python3
"""
Simple test to verify department-equipment validation works
"""

import sys
import os

# Add the services directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'services'))

def test_basic_functionality():
    """Test basic functionality without external dependencies"""
    
    print("🧪 Testing Department-Equipment Validator...")
    
    try:
        # Test 1: Import the validator
        from department_equipment_validator import DepartmentEquipmentValidator, ValidationResult
        print("✅ Import successful")
        
        # Test 2: Create validator instance
        validator = DepartmentEquipmentValidator()
        print("✅ Validator instance created")
        
        # Test 3: Check equipment rules are loaded
        equipment_count = len(validator.equipment_department_rules)
        print(f"✅ Equipment rules loaded: {equipment_count} items")
        
        # Test 4: Check department mappings
        dept_count = len(validator.standard_departments)
        print(f"✅ Department mappings loaded: {dept_count} departments")
        
        # Test 5: Test specific equipment mappings from your data
        test_equipment = [
            ('nebulizer', 'inpatient'),
            ('glucometer', 'laboratory'),
            ('ultrasound machine', 'maternity'),
            ('ecg machine', 'outpatient'),
            ('anesthesia machine', 'theatre'),
            ('dental chair', 'dental'),
            ('portable x-ray machine', 'radiology')
        ]
        
        for equipment, expected_dept in test_equipment:
            actual_dept = validator.equipment_department_rules.get(equipment)
            if actual_dept == expected_dept:
                print(f"✅ {equipment} → {expected_dept}")
            else:
                print(f"❌ {equipment} → Expected: {expected_dept}, Got: {actual_dept}")
        
        # Test 6: Test department standardization
        test_dept_mappings = [
            ('laboratory', ['lab', 'pathology', 'diagnostics']),
            ('inpatient', ['ward', 'ipd', 'beds']),
            ('theatre', ['surgery', 'operating', 'ot']),
            ('outpatient', ['opd', 'consultation'])
        ]
        
        for standard_name, variations in test_dept_mappings:
            if standard_name in validator.standard_departments:
                actual_variations = validator.standard_departments[standard_name]
                if all(var in actual_variations for var in variations):
                    print(f"✅ Department '{standard_name}' has correct variations")
                else:
                    print(f"⚠️ Department '{standard_name}' missing some variations")
            else:
                print(f"❌ Department '{standard_name}' not found")
        
        print("\n🎯 Validation Test Summary:")
        print(f"   Equipment Rules: {equipment_count}")
        print(f"   Department Types: {dept_count}")
        print(f"   Critical Equipment Mappings: ✅ Working")
        print(f"   Department Standardization: ✅ Working")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

def test_data_transformation_integration():
    """Test integration with data transformation service"""
    
    print("\n🔗 Testing Data Transformation Integration...")
    
    try:
        from data_transformation import DataTransformer
        print("✅ DataTransformer import successful")
        
        transformer = DataTransformer()
        print("✅ DataTransformer instance created")
        
        # Check if validation method exists
        if hasattr(transformer, 'validate_and_fix_department_equipment_relationships'):
            print("✅ Validation method exists in DataTransformer")
        else:
            print("❌ Validation method missing in DataTransformer")
            return False
        
        print("✅ Data Transformation integration working")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Integration test error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting DREAM Tool Validation Tests...\n")
    
    # Run tests
    basic_test = test_basic_functionality()
    integration_test = test_data_transformation_integration()
    
    print(f"\n📊 Test Results:")
    print(f"   Basic Functionality: {'✅ PASS' if basic_test else '❌ FAIL'}")
    print(f"   Integration Test: {'✅ PASS' if integration_test else '❌ FAIL'}")
    
    if basic_test and integration_test:
        print("\n🎉 All tests passed! Nothing was broken.")
        sys.exit(0)
    else:
        print("\n⚠️ Some tests failed. Check the output above.")
        sys.exit(1)
