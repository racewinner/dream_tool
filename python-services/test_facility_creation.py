#!/usr/bin/env python3
"""
Test facility creation directly
"""

from models.database_models import FacilityType, FacilityStatus, Facility
from services.database_service import db_service

print("Testing facility creation...")

# Test 1: Create enum objects
print("\n1. Testing enum creation:")
try:
    healthcare_enum = FacilityType.HEALTHCARE
    survey_enum = FacilityStatus.SURVEY
    print(f"✅ FacilityType.HEALTHCARE = {healthcare_enum}")
    print(f"✅ FacilityStatus.SURVEY = {survey_enum}")
except Exception as e:
    print(f"❌ Enum creation failed: {e}")

# Test 2: Create facility data dict
print("\n2. Testing facility data creation:")
try:
    facility_data = {
        'name': 'Test Healthcare Facility',
        'type': FacilityType.HEALTHCARE.value,  # Use .value to get string
        'latitude': 2.3456,
        'longitude': 43.6543,
        'status': FacilityStatus.SURVEY.value  # Use .value to get string
    }
    print(f"✅ Facility data created: {facility_data}")
except Exception as e:
    print(f"❌ Facility data creation failed: {e}")

# Test 3: Create facility using database service
print("\n3. Testing database service facility creation:")
try:
    facility = db_service.create_facility(facility_data)
    print(f"✅ Facility created successfully: ID {facility.id}")
    print(f"   Name: {facility.name}")
    print(f"   Type: {facility.type}")
    print(f"   Status: {facility.status}")
except Exception as e:
    print(f"❌ Database service creation failed: {e}")
    import traceback
    traceback.print_exc()

# Test 4: Direct SQLAlchemy creation
print("\n4. Testing direct SQLAlchemy creation:")
try:
    from core.database import SessionLocal
    
    with SessionLocal() as db:
        direct_facility = Facility(
            name='Direct Test Facility',
            type=FacilityType.HEALTHCARE.value,  # Use .value to get string
            latitude=1.2345,
            longitude=42.1234,
            status=FacilityStatus.SURVEY.value  # Use .value to get string
        )
        db.add(direct_facility)
        db.commit()
        db.refresh(direct_facility)
        print(f"✅ Direct facility created: ID {direct_facility.id}")
        
except Exception as e:
    print(f"❌ Direct creation failed: {e}")
    import traceback
    traceback.print_exc()

print("\n✅ Test completed")
