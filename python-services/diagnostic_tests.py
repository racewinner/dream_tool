#!/usr/bin/env python3
"""
Comprehensive Diagnostic Tests for SQLAlchemy Enum Issues
"""

import sys
from pathlib import Path
from datetime import datetime

# Add current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from core.database import engine, SessionLocal
from models.database_models import FacilityType, FacilityStatus, Facility
from sqlalchemy import inspect, text
import logging

# Disable SQLAlchemy logging for cleaner output
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

print("🔬 COMPREHENSIVE DIAGNOSTIC TESTS")
print("=" * 60)

def test_1_direct_database_insert():
    """Test 1: Direct SQL insert to confirm database accepts values"""
    print("\n1️⃣ TEST 1: Direct Database Insert")
    print("-" * 40)
    
    try:
        with engine.connect() as conn:
            # Test direct SQL insert
            result = conn.execute(text("""
                INSERT INTO facilities (name, type, latitude, longitude, status, "createdAt", "updatedAt") 
                VALUES ('Direct SQL Test', 'healthcare', 1.0, 1.0, 'survey', NOW(), NOW())
                RETURNING id, name, type, status
            """))
            
            row = result.fetchone()
            print(f"✅ Direct SQL insert successful!")
            print(f"   ID: {row[0]}")
            print(f"   Name: {row[1]}")
            print(f"   Type: {row[2]}")
            print(f"   Status: {row[3]}")
            
            # Clean up
            conn.execute(text("DELETE FROM facilities WHERE name = 'Direct SQL Test'"))
            conn.commit()
            
            return True
            
    except Exception as e:
        print(f"❌ Direct SQL insert failed: {e}")
        return False

def test_2_sqlalchemy_metadata_inspection():
    """Test 2: Inspect SQLAlchemy's understanding of database schema"""
    print("\n2️⃣ TEST 2: SQLAlchemy Metadata Inspection")
    print("-" * 40)
    
    try:
        inspector = inspect(engine)
        
        # Get table info
        tables = inspector.get_table_names()
        print(f"✅ Tables found: {len(tables)}")
        print(f"   Facilities table exists: {'facilities' in tables}")
        
        if 'facilities' in tables:
            # Get column info
            columns = inspector.get_columns('facilities')
            print(f"\n📊 Facilities table columns:")
            for col in columns:
                print(f"   - {col['name']}: {col['type']} (nullable: {col['nullable']})")
            
            # Check for enum types
            try:
                enums = inspector.get_enums()
                print(f"\n🔍 Database enum types found: {len(enums)}")
                for enum_info in enums:
                    print(f"   - {enum_info['name']}: {enum_info['labels']}")
            except Exception as e:
                print(f"   Could not retrieve enum info: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Metadata inspection failed: {e}")
        return False

def test_3_raw_sql_through_sqlalchemy():
    """Test 3: Raw SQL through SQLAlchemy session"""
    print("\n3️⃣ TEST 3: Raw SQL Through SQLAlchemy Session")
    print("-" * 40)
    
    try:
        with SessionLocal() as db:
            # Test raw SQL insert through SQLAlchemy session
            result = db.execute(text("""
                INSERT INTO facilities (name, type, latitude, longitude, status, "createdAt", "updatedAt") 
                VALUES ('SQLAlchemy Raw Test', 'healthcare', 2.0, 2.0, 'survey', NOW(), NOW())
                RETURNING id, name, type, status
            """))
            
            row = result.fetchone()
            print(f"✅ SQLAlchemy raw SQL successful!")
            print(f"   ID: {row[0]}")
            print(f"   Name: {row[1]}")
            print(f"   Type: {row[2]}")
            print(f"   Status: {row[3]}")
            
            # Clean up
            db.execute(text("DELETE FROM facilities WHERE name = 'SQLAlchemy Raw Test'"))
            db.commit()
            
            return True
            
    except Exception as e:
        print(f"❌ SQLAlchemy raw SQL failed: {e}")
        return False

def test_4_enum_object_serialization():
    """Test 4: How SQLAlchemy serializes enum objects"""
    print("\n4️⃣ TEST 4: Enum Object Serialization")
    print("-" * 40)
    
    try:
        healthcare_enum = FacilityType.HEALTHCARE
        survey_enum = FacilityStatus.SURVEY
        
        print(f"📋 Enum Object Analysis:")
        print(f"   FacilityType.HEALTHCARE:")
        print(f"     - Object: {healthcare_enum}")
        print(f"     - Name: {healthcare_enum.name}")
        print(f"     - Value: {healthcare_enum.value}")
        print(f"     - str(): '{str(healthcare_enum)}'")
        print(f"     - repr(): {repr(healthcare_enum)}")
        
        print(f"   FacilityStatus.SURVEY:")
        print(f"     - Object: {survey_enum}")
        print(f"     - Name: {survey_enum.name}")
        print(f"     - Value: {survey_enum.value}")
        print(f"     - str(): '{str(survey_enum)}'")
        print(f"     - repr(): {repr(survey_enum)}")
        
        # Test what SQLAlchemy would receive
        from sqlalchemy.sql.sqltypes import Enum as SQLEnum
        enum_type = SQLEnum(FacilityType)
        
        print(f"\n🔍 SQLAlchemy Enum Type Analysis:")
        print(f"   Enum type: {enum_type}")
        print(f"   Enum class: {enum_type.enum_class}")
        
        # Test enum processing
        try:
            processed_value = enum_type.process_bind_param(healthcare_enum, None)
            print(f"   process_bind_param(HEALTHCARE): '{processed_value}'")
        except Exception as e:
            print(f"   process_bind_param failed: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Enum serialization test failed: {e}")
        return False

def test_5_facility_model_creation():
    """Test 5: Facility model creation with different approaches"""
    print("\n5️⃣ TEST 5: Facility Model Creation Approaches")
    print("-" * 40)
    
    approaches = [
        ("Enum Objects", FacilityType.HEALTHCARE, FacilityStatus.SURVEY),
        ("Enum Values", FacilityType.HEALTHCARE.value, FacilityStatus.SURVEY.value),
        ("Plain Strings", 'healthcare', 'survey')
    ]
    
    for approach_name, type_value, status_value in approaches:
        print(f"\n🧪 Testing {approach_name}:")
        print(f"   Type: {type_value} ({type(type_value)})")
        print(f"   Status: {status_value} ({type(status_value)})")
        
        try:
            with SessionLocal() as db:
                facility = Facility(
                    name=f'Test {approach_name}',
                    type=type_value,
                    latitude=3.0,
                    longitude=3.0,
                    status=status_value
                )
                
                db.add(facility)
                db.flush()  # This will trigger the SQL generation
                
                print(f"   ✅ Model creation successful (ID: {facility.id})")
                
                # Clean up
                db.delete(facility)
                db.commit()
                
        except Exception as e:
            print(f"   ❌ Model creation failed: {e}")

def test_6_database_enum_constraints():
    """Test 6: Test database enum constraints directly"""
    print("\n6️⃣ TEST 6: Database Enum Constraints")
    print("-" * 40)
    
    test_values = [
        ('healthcare', True),
        ('education', True),
        ('agriculture', True),
        ('invalid_type', False),
        ('HEALTHCARE', False),  # Test if uppercase fails
    ]
    
    for test_value, should_succeed in test_values:
        print(f"\n🧪 Testing enum value: '{test_value}'")
        
        try:
            with engine.connect() as conn:
                conn.execute(text("""
                    INSERT INTO facilities (name, type, latitude, longitude, status, "createdAt", "updatedAt") 
                    VALUES (:name, :type, 1.0, 1.0, 'survey', NOW(), NOW())
                """), {"name": f"Test {test_value}", "type": test_value})
                
                if should_succeed:
                    print(f"   ✅ '{test_value}' accepted by database")
                    # Clean up
                    conn.execute(text("DELETE FROM facilities WHERE name = :name"), {"name": f"Test {test_value}"})
                else:
                    print(f"   ⚠️  '{test_value}' unexpectedly accepted")
                
                conn.commit()
                
        except Exception as e:
            if should_succeed:
                print(f"   ❌ '{test_value}' unexpectedly rejected: {e}")
            else:
                print(f"   ✅ '{test_value}' correctly rejected by database")

def main():
    """Run all diagnostic tests"""
    print("Starting comprehensive diagnostic tests...")
    
    tests = [
        test_1_direct_database_insert,
        test_2_sqlalchemy_metadata_inspection,
        test_3_raw_sql_through_sqlalchemy,
        test_4_enum_object_serialization,
        test_5_facility_model_creation,
        test_6_database_enum_constraints
    ]
    
    results = []
    for test_func in tests:
        try:
            result = test_func()
            results.append(result)
        except Exception as e:
            print(f"❌ Test {test_func.__name__} crashed: {e}")
            results.append(False)
    
    print("\n" + "=" * 60)
    print("🎯 DIAGNOSTIC SUMMARY")
    print("=" * 60)
    
    test_names = [
        "Direct Database Insert",
        "SQLAlchemy Metadata Inspection", 
        "Raw SQL Through SQLAlchemy",
        "Enum Object Serialization",
        "Facility Model Creation",
        "Database Enum Constraints"
    ]
    
    for i, (test_name, result) in enumerate(zip(test_names, results)):
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{i+1}. {test_name}: {status}")
    
    passed = sum(results)
    total = len(results)
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All diagnostics passed - issue is likely in model configuration")
    else:
        print("🔍 Some diagnostics failed - this will help identify the root cause")

if __name__ == "__main__":
    main()
