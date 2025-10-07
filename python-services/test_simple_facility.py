#!/usr/bin/env python3
"""
Test simple facility creation with string values
"""

from services.database_service import db_service

print("Testing simple facility creation with string values...")

# Test: Create facility with plain string values (matching database enum values)
print("\n1. Testing with plain string values:")
try:
    facility_data = {
        'name': 'Simple Test Facility',
        'type': 'healthcare',  # Use lowercase string that matches database
        'latitude': 2.3456,
        'longitude': 43.6543,
        'status': 'survey'  # Use lowercase string that matches database
    }
    
    facility = db_service.create_facility(facility_data)
    print(f"✅ Facility created successfully: ID {facility.id}")
    print(f"   Name: {facility.name}")
    print(f"   Type: {facility.type}")
    print(f"   Status: {facility.status}")
    print(f"   Location: ({facility.latitude}, {facility.longitude})")
    
except Exception as e:
    print(f"❌ Simple creation failed: {e}")
    import traceback
    traceback.print_exc()

print("\n✅ Test completed")
