#!/usr/bin/env python3
"""
Comprehensive SQLAlchemy Enum Handling System
Provides proper enum type handling with database compatibility
"""

import enum
import logging
from typing import Any, Optional, Type, Union
from sqlalchemy.types import TypeDecorator, String
from sqlalchemy import Enum as SQLEnum

logger = logging.getLogger(__name__)

class EnumAsString(TypeDecorator):
    """
    Custom SQLAlchemy type that stores enums as strings in database
    but returns proper enum objects in Python code.
    
    This solves the enum conversion issues while maintaining type safety.
    """
    impl = String
    cache_ok = True
    
    def __init__(self, enum_class: Type[enum.Enum], **kwargs):
        self.enum_class = enum_class
        # Calculate max length from enum values
        max_length = max(len(e.value) for e in enum_class) if enum_class else 50
        super().__init__(length=max_length, **kwargs)
    
    def process_bind_param(self, value: Any, dialect) -> Optional[str]:
        """Convert enum object to string for database storage"""
        if value is None:
            return None
        
        if isinstance(value, self.enum_class):
            return value.value
        
        if isinstance(value, str):
            # Validate that string is a valid enum value
            try:
                self.enum_class(value)
                return value
            except ValueError:
                logger.warning(f"Invalid enum value '{value}' for {self.enum_class.__name__}")
                return value  # Store invalid value, let database constraints handle it
        
        logger.warning(f"Unexpected type {type(value)} for enum {self.enum_class.__name__}")
        return str(value)
    
    def process_result_value(self, value: Optional[str], dialect) -> Optional[enum.Enum]:
        """Convert string from database back to enum object"""
        if value is None:
            return None
        
        try:
            return self.enum_class(value)
        except ValueError:
            logger.error(f"Database contains invalid enum value '{value}' for {self.enum_class.__name__}")
            # Return a special "unknown" enum or the string value
            # This prevents crashes when database has invalid data
            return value  # Return string as fallback

class FlexibleEnum(TypeDecorator):
    """
    More flexible enum type that can handle both enum objects and strings
    with automatic conversion and validation.
    """
    impl = String
    cache_ok = True
    
    def __init__(self, enum_class: Type[enum.Enum], allow_invalid: bool = False, **kwargs):
        self.enum_class = enum_class
        self.allow_invalid = allow_invalid
        max_length = max(len(e.value) for e in enum_class) if enum_class else 50
        super().__init__(length=max_length, **kwargs)
    
    def process_bind_param(self, value: Any, dialect) -> Optional[str]:
        """Convert input to string for database storage with validation"""
        if value is None:
            return None
        
        # Handle enum objects
        if isinstance(value, self.enum_class):
            return value.value
        
        # Handle string inputs
        if isinstance(value, str):
            # Try to validate the string
            try:
                enum_obj = self.enum_class(value)
                return enum_obj.value
            except ValueError:
                if self.allow_invalid:
                    logger.warning(f"Storing invalid enum value '{value}' for {self.enum_class.__name__}")
                    return value
                else:
                    raise ValueError(f"Invalid enum value '{value}' for {self.enum_class.__name__}. "
                                   f"Valid values: {[e.value for e in self.enum_class]}")
        
        # Handle other types
        str_value = str(value)
        if self.allow_invalid:
            logger.warning(f"Converting {type(value)} to string for enum {self.enum_class.__name__}: '{str_value}'")
            return str_value
        else:
            raise TypeError(f"Cannot convert {type(value)} to {self.enum_class.__name__}")
    
    def process_result_value(self, value: Optional[str], dialect) -> Union[enum.Enum, str, None]:
        """Convert string from database back to enum object"""
        if value is None:
            return None
        
        try:
            return self.enum_class(value)
        except ValueError:
            if self.allow_invalid:
                logger.warning(f"Database contains invalid enum value '{value}' for {self.enum_class.__name__}")
                return value  # Return string as fallback
            else:
                raise ValueError(f"Database contains invalid enum value '{value}' for {self.enum_class.__name__}")

def create_enum_column(enum_class: Type[enum.Enum], 
                      nullable: bool = False,
                      default: Optional[enum.Enum] = None,
                      flexible: bool = True,
                      allow_invalid: bool = False,
                      **kwargs) -> TypeDecorator:
    """
    Factory function to create properly configured enum columns.
    
    Args:
        enum_class: The enum class to use
        nullable: Whether the column can be NULL
        default: Default enum value
        flexible: Use FlexibleEnum (more forgiving) vs EnumAsString (strict)
        allow_invalid: Whether to allow invalid enum values (for data migration)
    
    Returns:
        Configured SQLAlchemy column type
    """
    if flexible:
        return FlexibleEnum(enum_class, allow_invalid=allow_invalid)
    else:
        return EnumAsString(enum_class)

# Utility functions for enum handling
def normalize_enum_value(value: Any, enum_class: Type[enum.Enum]) -> str:
    """Convert any enum input to its string value"""
    if value is None:
        return None
    
    if isinstance(value, enum_class):
        return value.value
    
    if isinstance(value, str):
        # Validate that it's a valid enum value
        try:
            enum_class(value)
            return value
        except ValueError:
            raise ValueError(f"'{value}' is not a valid {enum_class.__name__} value")
    
    raise TypeError(f"Cannot convert {type(value)} to {enum_class.__name__}")

def denormalize_enum_value(value: Optional[str], enum_class: Type[enum.Enum]) -> Optional[enum.Enum]:
    """Convert string value back to enum object"""
    if value is None:
        return None
    
    try:
        return enum_class(value)
    except ValueError:
        logger.error(f"Cannot convert '{value}' to {enum_class.__name__}")
        return None

def validate_enum_data(data: dict, enum_mappings: dict) -> dict:
    """
    Validate and preserve enum values in a data dictionary.
    For SQLAlchemy custom enum types, we preserve enum objects.
    
    Args:
        data: Dictionary containing data to validate
        enum_mappings: Dict mapping field names to enum classes
    
    Returns:
        Dictionary with validated enum values (preserves enum objects)
    """
    normalized_data = data.copy()
    
    for field_name, enum_class in enum_mappings.items():
        if field_name in normalized_data:
            value = normalized_data[field_name]
            try:
                # If it's already an enum object of the correct type, keep it
                if isinstance(value, enum_class):
                    logger.debug(f"Preserving enum object for {field_name}: {value} (type: {type(value)})")
                    continue
                
                # If it's a string, convert to enum object
                if isinstance(value, str):
                    enum_obj = enum_class(value)
                    normalized_data[field_name] = enum_obj
                    logger.debug(f"Converted string to enum for {field_name}: '{value}' -> {enum_obj} (type: {type(enum_obj)})")
                    continue
                
                # For other types, try to convert via string
                enum_obj = enum_class(str(value))
                normalized_data[field_name] = enum_obj
                logger.debug(f"Converted {type(value)} to enum for {field_name}: {value} -> {enum_obj} (type: {type(enum_obj)})")
                
            except (ValueError, TypeError) as e:
                logger.error(f"Enum validation failed for {field_name}: {e}")
                # Remove invalid field rather than crash
                del normalized_data[field_name]
    
    return normalized_data

# Configuration for different environments
class EnumConfig:
    """Configuration for enum handling in different environments"""
    
    @staticmethod
    def get_development_config():
        """Development configuration - more forgiving"""
        return {
            'flexible': True,
            'allow_invalid': True,  # Allow invalid data during development
            'log_warnings': True
        }
    
    @staticmethod
    def get_production_config():
        """Production configuration - strict validation"""
        return {
            'flexible': False,
            'allow_invalid': False,  # Strict validation in production
            'log_warnings': True
        }
    
    @staticmethod
    def get_migration_config():
        """Configuration for data migration - very forgiving"""
        return {
            'flexible': True,
            'allow_invalid': True,  # Allow any data during migration
            'log_warnings': False   # Don't spam logs during migration
        }
