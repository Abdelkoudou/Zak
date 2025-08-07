from fastapi import Depends, HTTPException, status
from .models import User, UserType
from .auth import get_current_active_user

def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """Require admin role"""
    if current_user.user_type != UserType.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def require_manager_or_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """Require manager or admin role"""
    if current_user.user_type not in [UserType.ADMIN, UserType.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager or admin access required"
        )
    return current_user

def require_paid_user(current_user: User = Depends(get_current_active_user)) -> User:
    """Require paid user"""
    if not current_user.is_paid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Paid subscription required"
        )
    return current_user

def can_manage_users(current_user: User = Depends(get_current_active_user)) -> User:
    """Check if user can manage other users (admin or manager)"""
    if current_user.user_type not in [UserType.ADMIN, UserType.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager or admin access required to manage users"
        )
    return current_user

def can_create_questions(current_user: User = Depends(get_current_active_user)) -> User:
    """Check if user can create questions (manager or admin)"""
    if current_user.user_type not in [UserType.ADMIN, UserType.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager or admin access required to create questions"
        )
    return current_user 