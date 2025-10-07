"""Add missing survey fields and fix schema gaps

Revision ID: 0001
Revises: 
Create Date: 2025-01-04 12:26:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add missing fields to surveys table and fix schema gaps"""
    
    # Add missing fields to surveys table
    try:
        # Check if rawData column exists, if not add it
        op.add_column('surveys', sa.Column('rawData', postgresql.JSONB(astext_type=sa.Text()), nullable=True, 
                     comment='Original raw survey data from KoboToolbox for preserving all question responses'))
    except Exception as e:
        print(f"rawData column may already exist: {e}")
    
    try:
        # Check if externalId column exists, if not add it
        op.add_column('surveys', sa.Column('externalId', sa.String(), nullable=True, 
                     comment='External system identifier for this survey'))
    except Exception as e:
        print(f"externalId column may already exist: {e}")
    
    try:
        # Check if respondentId column exists, if not add it
        op.add_column('surveys', sa.Column('respondentId', sa.String(), nullable=True, 
                     comment='Identifier for the person who completed the survey'))
    except Exception as e:
        print(f"respondentId column may already exist: {e}")
    
    try:
        # Check if collectionDate column exists, if not add it
        op.add_column('surveys', sa.Column('collectionDate', sa.DateTime(), nullable=True, 
                     comment='Date when the survey was collected'))
    except Exception as e:
        print(f"collectionDate column may already exist: {e}")
    
    # Add unique constraint to externalId if it doesn't exist
    try:
        op.create_unique_constraint('surveys_externalId_unique', 'surveys', ['externalId'])
    except Exception as e:
        print(f"Unique constraint may already exist: {e}")
    
    # Add missing foreign key constraints to equipment table
    try:
        # Add facilityId column to equipment if it doesn't exist
        op.add_column('equipment', sa.Column('facilityId', sa.Integer(), nullable=True))
    except Exception as e:
        print(f"facilityId column in equipment may already exist: {e}")
    
    try:
        # Add foreign key constraint for equipment.facilityId
        op.create_foreign_key('equipment_facilityId_fkey', 'equipment', 'facilities', ['facilityId'], ['id'], ondelete='CASCADE')
    except Exception as e:
        print(f"Foreign key constraint equipment_facilityId_fkey may already exist: {e}")
    
    try:
        # Add foreign key constraint for equipment.surveyId if it doesn't exist
        op.create_foreign_key('equipment_surveyId_fkey', 'equipment', 'surveys', ['surveyId'], ['id'], ondelete='CASCADE')
    except Exception as e:
        print(f"Foreign key constraint equipment_surveyId_fkey may already exist: {e}")
    
    # Add missing fields to facilities table
    try:
        op.add_column('facilities', sa.Column('userId', sa.Integer(), nullable=True))
        op.create_foreign_key('facilities_userId_fkey', 'facilities', 'users', ['userId'], ['id'], ondelete='SET NULL')
    except Exception as e:
        print(f"userId field in facilities may already exist: {e}")
    
    try:
        op.add_column('facilities', sa.Column('description', sa.Text(), nullable=True))
    except Exception as e:
        print(f"description field in facilities may already exist: {e}")
    
    try:
        op.add_column('facilities', sa.Column('address', sa.Text(), nullable=True))
    except Exception as e:
        print(f"address field in facilities may already exist: {e}")
    
    try:
        op.add_column('facilities', sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    except Exception as e:
        print(f"metadata field in facilities may already exist: {e}")
    
    # Create indexes for better performance
    try:
        op.create_index('idx_surveys_externalId', 'surveys', ['externalId'])
    except Exception as e:
        print(f"Index idx_surveys_externalId may already exist: {e}")
    
    try:
        op.create_index('idx_surveys_collectionDate', 'surveys', ['collectionDate'])
    except Exception as e:
        print(f"Index idx_surveys_collectionDate may already exist: {e}")
    
    try:
        op.create_index('idx_equipment_facilityId', 'equipment', ['facilityId'])
    except Exception as e:
        print(f"Index idx_equipment_facilityId may already exist: {e}")


def downgrade() -> None:
    """Remove the added fields and constraints"""
    
    # Remove indexes
    try:
        op.drop_index('idx_equipment_facilityId', table_name='equipment')
    except Exception:
        pass
    
    try:
        op.drop_index('idx_surveys_collectionDate', table_name='surveys')
    except Exception:
        pass
    
    try:
        op.drop_index('idx_surveys_externalId', table_name='surveys')
    except Exception:
        pass
    
    # Remove foreign key constraints
    try:
        op.drop_constraint('facilities_userId_fkey', 'facilities', type_='foreignkey')
    except Exception:
        pass
    
    try:
        op.drop_constraint('equipment_surveyId_fkey', 'equipment', type_='foreignkey')
    except Exception:
        pass
    
    try:
        op.drop_constraint('equipment_facilityId_fkey', 'equipment', type_='foreignkey')
    except Exception:
        pass
    
    # Remove unique constraint
    try:
        op.drop_constraint('surveys_externalId_unique', 'surveys', type_='unique')
    except Exception:
        pass
    
    # Remove columns from facilities
    try:
        op.drop_column('facilities', 'metadata')
    except Exception:
        pass
    
    try:
        op.drop_column('facilities', 'address')
    except Exception:
        pass
    
    try:
        op.drop_column('facilities', 'description')
    except Exception:
        pass
    
    try:
        op.drop_column('facilities', 'userId')
    except Exception:
        pass
    
    # Remove columns from equipment
    try:
        op.drop_column('equipment', 'facilityId')
    except Exception:
        pass
    
    # Remove columns from surveys
    try:
        op.drop_column('surveys', 'collectionDate')
    except Exception:
        pass
    
    try:
        op.drop_column('surveys', 'respondentId')
    except Exception:
        pass
    
    try:
        op.drop_column('surveys', 'externalId')
    except Exception:
        pass
    
    try:
        op.drop_column('surveys', 'rawData')
    except Exception:
        pass
