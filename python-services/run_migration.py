#!/usr/bin/env python3
"""
Database Migration Script
Runs Alembic migrations to sync database schema with Python models
"""

import os
import sys
import subprocess
from pathlib import Path

# Add current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from core.database import test_connection, engine
from sqlalchemy import text

def check_database_connection():
    """Test database connection before running migrations"""
    print("🔍 Testing database connection...")
    if test_connection():
        print("✅ Database connection successful")
        return True
    else:
        print("❌ Database connection failed")
        return False

def check_current_schema():
    """Check current database schema"""
    print("\n🔍 Checking current database schema...")
    try:
        with engine.connect() as conn:
            # Check if surveys table exists and what columns it has
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default 
                FROM information_schema.columns 
                WHERE table_name = 'surveys' AND table_schema = 'public'
                ORDER BY ordinal_position;
            """))
            
            surveys_columns = result.fetchall()
            print(f"📊 Surveys table has {len(surveys_columns)} columns:")
            for col in surveys_columns:
                print(f"  - {col[0]} ({col[1]}) {'NULL' if col[2] == 'YES' else 'NOT NULL'}")
            
            # Check for missing critical fields
            column_names = [col[0] for col in surveys_columns]
            missing_fields = []
            
            critical_fields = ['rawData', 'externalId', 'respondentId', 'collectionDate']
            for field in critical_fields:
                if field not in column_names:
                    missing_fields.append(field)
            
            if missing_fields:
                print(f"⚠️  Missing critical fields: {', '.join(missing_fields)}")
            else:
                print("✅ All critical fields present")
                
            return len(missing_fields) == 0
            
    except Exception as e:
        print(f"❌ Error checking schema: {e}")
        return False

def run_alembic_migration():
    """Run Alembic migration"""
    print("\n🚀 Running Alembic migration...")
    try:
        # Change to the python-services directory
        os.chdir(current_dir)
        
        # Run alembic upgrade
        result = subprocess.run(['alembic', 'upgrade', 'head'], 
                              capture_output=True, text=True, check=True)
        
        print("✅ Migration completed successfully")
        print("Migration output:", result.stdout)
        if result.stderr:
            print("Migration warnings:", result.stderr)
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Migration failed: {e}")
        print("Error output:", e.stderr)
        return False
    except FileNotFoundError:
        print("❌ Alembic not found. Please install alembic: pip install alembic")
        return False

def verify_migration():
    """Verify that migration was successful"""
    print("\n🔍 Verifying migration results...")
    return check_current_schema()

def main():
    """Main migration process"""
    print("=" * 60)
    print("🐍 DREAM TOOL - Python Database Migration")
    print("=" * 60)
    
    # Step 1: Test database connection
    if not check_database_connection():
        print("\n❌ Cannot proceed without database connection")
        return False
    
    # Step 2: Check current schema
    schema_ok = check_current_schema()
    
    # Step 3: Run migration if needed
    if not schema_ok:
        print("\n🔧 Schema needs updates, running migration...")
        if not run_alembic_migration():
            print("\n❌ Migration failed")
            return False
    else:
        print("\n✅ Schema is already up to date")
    
    # Step 4: Verify results
    if verify_migration():
        print("\n🎉 Database migration completed successfully!")
        print("✅ All critical fields are now present")
        print("✅ Python services can now access the database properly")
        return True
    else:
        print("\n❌ Migration verification failed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
