"""Expand facility types to support full DREAM Tool taxonomy

Revision ID: 0002
Revises: 0001
Create Date: 2025-01-04 13:52:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None

def upgrade():
    """Add new facility types to support complete DREAM Tool taxonomy"""
    
    # Add new enum values to enum_facilities_type
    op.execute("ALTER TYPE enum_facilities_type ADD VALUE 'agriculture'")
    op.execute("ALTER TYPE enum_facilities_type ADD VALUE 'mobility'")
    op.execute("ALTER TYPE enum_facilities_type ADD VALUE 'ict'")
    op.execute("ALTER TYPE enum_facilities_type ADD VALUE 'public_institutions'")
    op.execute("ALTER TYPE enum_facilities_type ADD VALUE 'small_scale_businesses'")
    op.execute("ALTER TYPE enum_facilities_type ADD VALUE 'other'")

def downgrade():
    """Remove added facility types (Note: PostgreSQL doesn't support removing enum values directly)"""
    
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type, which is complex
    # For now, we'll leave the enum values in place
    pass
