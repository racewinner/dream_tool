#!/usr/bin/env python3
"""
Debug enum values
"""

from models.database_models import FacilityType, FacilityStatus

print("FacilityType enum values:")
for enum_val in FacilityType:
    print(f"  {enum_val.name} = '{enum_val.value}'")

print("\nFacilityStatus enum values:")
for enum_val in FacilityStatus:
    print(f"  {enum_val.name} = '{enum_val.value}'")

print("\nTesting enum creation:")
try:
    healthcare = FacilityType('healthcare')
    print(f"✅ FacilityType('healthcare') = {healthcare}")
except Exception as e:
    print(f"❌ FacilityType('healthcare') failed: {e}")

try:
    healthcare = FacilityType.HEALTHCARE
    print(f"✅ FacilityType.HEALTHCARE = {healthcare}")
except Exception as e:
    print(f"❌ FacilityType.HEALTHCARE failed: {e}")

try:
    survey = FacilityStatus('survey')
    print(f"✅ FacilityStatus('survey') = {survey}")
except Exception as e:
    print(f"❌ FacilityStatus('survey') failed: {e}")

try:
    survey = FacilityStatus.SURVEY
    print(f"✅ FacilityStatus.SURVEY = {survey}")
except Exception as e:
    print(f"❌ FacilityStatus.SURVEY failed: {e}")
