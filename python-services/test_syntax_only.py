#!/usr/bin/env python3
"""
Syntax-only test to verify code structure is correct
"""

import ast
import os

def test_python_syntax(file_path):
    """Test if Python file has valid syntax"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            source = f.read()
        
        # Parse the AST to check syntax
        ast.parse(source)
        return True, "Syntax OK"
    except SyntaxError as e:
        return False, f"Syntax Error: {e}"
    except Exception as e:
        return False, f"Error: {e}"

def main():
    print("🔍 Checking Python file syntax...\n")
    
    files_to_check = [
        'services/department_equipment_validator.py',
        'services/data_transformation.py', 
        'services/equipment_planning_service.py',
        'routes/equipment_planning_api.py',
        'main.py'
    ]
    
    all_passed = True
    
    for file_path in files_to_check:
        if os.path.exists(file_path):
            passed, message = test_python_syntax(file_path)
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{status} {file_path}: {message}")
            if not passed:
                all_passed = False
        else:
            print(f"⚠️ SKIP {file_path}: File not found")
    
    print(f"\n📊 Overall Result: {'✅ ALL SYNTAX CHECKS PASSED' if all_passed else '❌ SOME SYNTAX ERRORS FOUND'}")
    
    if all_passed:
        print("\n🎉 No syntax errors found! Code structure is correct.")
        
        # Additional checks
        print("\n🔧 Additional Checks:")
        
        # Check for duplicate dictionary keys in equipment rules
        try:
            with open('services/department_equipment_validator.py', 'r') as f:
                content = f.read()
                if 'air conditioner' in content:
                    air_conditioner_count = content.count("'air conditioner':")
                    if air_conditioner_count <= 1:
                        print("✅ No duplicate 'air conditioner' entries")
                    else:
                        print(f"⚠️ Found {air_conditioner_count} 'air conditioner' entries")
                
                if 'police computer' in content:
                    police_computer_count = content.count("'police computer':")
                    if police_computer_count <= 1:
                        print("✅ No duplicate 'police computer' entries")
                    else:
                        print(f"⚠️ Found {police_computer_count} 'police computer' entries")
                
                if 'morgue table' in content:
                    morgue_table_count = content.count("'morgue table':")
                    if morgue_table_count <= 1:
                        print("✅ No duplicate 'morgue table' entries")
                    else:
                        print(f"⚠️ Found {morgue_table_count} 'morgue table' entries")
                        
        except Exception as e:
            print(f"⚠️ Could not check for duplicates: {e}")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
