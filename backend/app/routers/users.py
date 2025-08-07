from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import crud, schemas, auth
from ..models import User
from ..permissions import can_manage_users, require_admin

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[schemas.User])
def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(can_manage_users),
    db: Session = Depends(get_db)
):
    """
    Get all users (manager or admin only).
    """
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

@router.get("/{user_id}", response_model=schemas.User)
def get_user(
    user_id: int,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific user by ID.
    Users can only access their own profile unless they're manager or admin.
    """
    if current_user.id != user_id and current_user.user_type.value not in ["admin", "manager", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update a user profile.
    Users can only update their own profile unless they're manager or admin.
    Managers and admins can update payment status and user types.
    Owner users cannot be edited by anyone except themselves.
    """
    # Get the target user first to check their role
    target_user = crud.get_user(db, user_id=user_id)
    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Owner users can only be edited by themselves
    if target_user.user_type.value == "owner" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner users cannot be edited by anyone else"
        )
    
    # Check if user is updating their own profile or has admin/manager privileges
    if current_user.id != user_id and current_user.user_type.value not in ["admin", "manager", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Only admins and owners can change user types
    if user_update.user_type is not None and current_user.user_type.value not in ["admin", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and owners can change user types"
        )
    
    user = crud.update_user(db=db, user_id=user_id, user_update=user_update)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a user account.
    Users can only delete their own account unless they're admin.
    Owner users cannot be deleted by anyone except themselves.
    """
    # Get the target user first to check their role
    target_user = crud.get_user(db, user_id=user_id)
    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Owner users can only be deleted by themselves
    if target_user.user_type.value == "owner" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner users cannot be deleted by anyone else"
        )
    
    if current_user.id != user_id:
        # In production, you should add admin role checking here
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    success = crud.delete_user(db=db, user_id=user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return {"message": "User deleted successfully"} 