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

@router.post("/activate")
def activate_with_key(
    activation_data: schemas.ActivationKeyUse,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Activate a user account using an activation key.
    """
    used_key = crud.use_activation_key(db=db, key=activation_data.key, user_id=current_user.id)
    if used_key is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or already used activation key"
        )
    
    return {
        "message": "Account activated successfully",
        "user_id": current_user.id,
        "is_paid": True,
        "expires_at": used_key.expires_at.isoformat() if used_key.expires_at else None
    }

@router.post("/change-password")
def change_password(
    password_change: schemas.PasswordChangeRequest,
    db: Session = Depends(get_db)
):
    """
    Change user password by providing email, current password, and new password.
    """
    success = crud.change_user_password(
        db=db,
        email=password_change.email,
        current_password=password_change.current_password,
        new_password=password_change.new_password
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or current password"
        )
    
    return {"message": "Password changed successfully"}

@router.get("/devices", response_model=List[schemas.DeviceSession])
def get_user_devices(
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all active device sessions for the current user.
    """
    devices = crud.get_user_device_sessions(db=db, user_id=current_user.id)
    return devices

@router.post("/devices", response_model=schemas.DeviceSession)
def register_device(
    device: schemas.DeviceSessionCreate,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Register a new device for the current user (max 2 devices).
    """
    device_session = crud.create_device_session(db=db, user_id=current_user.id, device_session=device)
    return device_session

@router.delete("/devices/{device_id}")
def deactivate_device(
    device_id: int,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Deactivate a device session.
    """
    success = crud.deactivate_device_session(db=db, user_id=current_user.id, device_id=device_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    return {"message": "Device deactivated successfully"} 