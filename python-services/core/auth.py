"""
Authentication integration with TypeScript backend
Validates JWT tokens issued by the main backend
"""

import jwt
import httpx
import os
from fastapi import HTTPException, status
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# JWT configuration (should match TypeScript backend)
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3001")

async def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify JWT token and return user information
    
    Args:
        token: JWT token string
        
    Returns:
        Dict containing user information
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # Option 1: Decode JWT directly (if we have the same secret)
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("userId") or payload.get("user_id")
            
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: missing user ID"
                )
            
            # Return user info from token
            return {
                "id": user_id,
                "email": payload.get("email"),
                "role": payload.get("role"),
                "isVerified": payload.get("isVerified", False)
            }
            
        except jwt.InvalidTokenError:
            # Option 2: Validate with TypeScript backend
            return await validate_with_backend(token)
            
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

async def validate_with_backend(token: str) -> Dict[str, Any]:
    """
    Validate token with TypeScript backend
    
    Args:
        token: JWT token string
        
    Returns:
        Dict containing user information
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BACKEND_URL}/api/auth/verify",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("user", {})
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token validation failed"
                )
                
    except httpx.RequestError as e:
        logger.error(f"Backend validation request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable"
        )

def get_current_user(token: str) -> Dict[str, Any]:
    """
    Synchronous version of verify_token for non-async contexts
    """
    import asyncio
    return asyncio.run(verify_token(token))

class AuthenticationError(Exception):
    """Custom authentication error"""
    pass

def require_role(required_role: str):
    """
    Decorator to require specific user role
    
    Args:
        required_role: Required user role
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Extract user from kwargs (should be injected by dependency)
            user = kwargs.get('current_user')
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            user_role = user.get('role', '')
            if user_role != required_role and user_role != 'admin':
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role '{required_role}' required"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Role hierarchy for permission checking
ROLE_HIERARCHY = {
    'admin': 4,
    'technical_expert': 3,
    'technical_junior': 2,
    'non_technical': 1
}

def has_permission(user_role: str, required_role: str) -> bool:
    """
    Check if user role has permission for required role
    
    Args:
        user_role: User's current role
        required_role: Required role for operation
        
    Returns:
        True if user has permission
    """
    user_level = ROLE_HIERARCHY.get(user_role, 0)
    required_level = ROLE_HIERARCHY.get(required_role, 0)
    
    return user_level >= required_level

def get_user_role(user: Dict[str, Any]) -> str:
    """
    Extract user role from user data
    
    Args:
        user: User data dictionary
        
    Returns:
        User role string
    """
    return user.get('role', 'non_technical')
