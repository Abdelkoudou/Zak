from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from .. import crud, schemas, auth
from ..models import User, UserType, Question, Answer, ActivationKey
from ..permissions import require_admin, can_manage_users

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/dashboard")
def get_dashboard_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get admin dashboard statistics.
    Admin only.
    """
    # User statistics
    total_users = db.query(func.count(User.id)).scalar()
    paid_users = db.query(func.count(User.id)).filter(User.is_paid == True).scalar()
    owner_users = db.query(func.count(User.id)).filter(User.user_type == UserType.OWNER).scalar()
    admin_users = db.query(func.count(User.id)).filter(User.user_type == UserType.ADMIN).scalar()
    manager_users = db.query(func.count(User.id)).filter(User.user_type == UserType.MANAGER).scalar()
    student_users = db.query(func.count(User.id)).filter(User.user_type == UserType.STUDENT).scalar()
    
    # Question statistics
    total_questions = db.query(func.count(Question.id)).scalar()
    total_answers = db.query(func.count(Answer.id)).scalar()
    
    # Activation key statistics
    total_keys = db.query(func.count(ActivationKey.id)).scalar()
    used_keys = db.query(func.count(ActivationKey.id)).filter(ActivationKey.is_used == True).scalar()
    
    # Course statistics
    courses = db.query(Question.course, func.count(Question.id)).group_by(Question.course).all()
    course_stats = [{"course": course, "count": count} for course, count in courses]
    
    # Speciality statistics
    specialities = db.query(Question.speciality, func.count(Question.id)).filter(Question.speciality != None).group_by(Question.speciality).all()
    speciality_stats = [{"speciality": speciality, "count": count} for speciality, count in specialities]
    
    # Year statistics
    years = db.query(Question.year, func.count(Question.id)).group_by(Question.year).order_by(Question.year).all()
    year_stats = [{"year": year, "count": count} for year, count in years]
    
    return {
        "user_stats": {
            "total_users": total_users,
            "paid_users": paid_users,
            "unpaid_users": total_users - paid_users,
            "owner_users": owner_users,
            "admin_users": admin_users,
            "manager_users": manager_users,
            "student_users": student_users
        },
        "question_stats": {
            "total_questions": total_questions,
            "total_answers": total_answers,
            "average_answers_per_question": total_answers / total_questions if total_questions > 0 else 0
        },
        "activation_key_stats": {
            "total_keys": total_keys,
            "used_keys": used_keys,
            "unused_keys": total_keys - used_keys
        },
        "course_stats": course_stats,
        "speciality_stats": speciality_stats,
        "year_stats": year_stats
    }

@router.get("/users", response_model=List[schemas.User])
def get_all_users_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_type: Optional[UserType] = Query(None, description="Filter by user type"),
    is_paid: Optional[bool] = Query(None, description="Filter by payment status"),
    current_user: User = Depends(can_manage_users),
    db: Session = Depends(get_db)
):
    """
    Get all users with filtering options (manager or admin only).
    """
    query = db.query(User)
    
    if user_type:
        query = query.filter(User.user_type == user_type)
    if is_paid is not None:
        query = query.filter(User.is_paid == is_paid)
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.put("/users/{user_id}/payment")
def update_user_payment_status(
    user_id: int,
    is_paid: bool,
    current_user: User = Depends(can_manage_users),
    db: Session = Depends(get_db)
):
    """
    Update user payment status (manager or admin only).
    Owner users cannot be edited by anyone except themselves.
    """
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Owner users can only be edited by themselves
    if user.user_type.value == "owner" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner users cannot be edited by anyone else"
        )
    
    user.is_paid = is_paid
    db.commit()
    db.refresh(user)
    
    return {
        "message": f"User payment status updated successfully",
        "user_id": user_id,
        "is_paid": is_paid
    }

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    user_type: UserType,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update user role (admin only).
    Owner users cannot be edited by anyone except themselves.
    """
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Owner users can only be edited by themselves
    if user.user_type.value == "owner" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner users cannot be edited by anyone else"
        )
    
    # Prevent admin from changing their own role (but allow owner)
    if user_id == current_user.id and current_user.user_type != UserType.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    user.user_type = user_type
    db.commit()
    db.refresh(user)
    
    return {
        "message": f"User role updated successfully",
        "user_id": user_id,
        "user_type": user_type.value
    }

@router.get("/users/{user_id}/details")
def get_user_detailed_info(
    user_id: int,
    current_user: User = Depends(can_manage_users),
    db: Session = Depends(get_db)
):
    """
    Get detailed user information (manager or admin only).
    """
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "user_type": user.user_type.value,
        "is_paid": user.is_paid,
        "created_at": user.created_at,
        "updated_at": user.updated_at
    }

@router.delete("/users/{user_id}")
def delete_user_admin(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a user (admin only).
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
    
    # Prevent admin from deleting themselves (but allow owner)
    if user_id == current_user.id and current_user.user_type != UserType.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    success = crud.delete_user(db=db, user_id=user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return {"message": "User deleted successfully"}

# Activation Key management endpoints
@router.post("/activation-keys", response_model=schemas.ActivationKey)
def create_activation_key(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Generate a new activation key (admin/owner only).
    """
    return crud.create_activation_key(db=db, created_by=current_user.id)

@router.get("/activation-keys", response_model=List[schemas.ActivationKey])
def get_activation_keys(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_used: Optional[bool] = Query(None, description="Filter by usage status"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get all activation keys (admin/owner only).
    """
    return crud.get_activation_keys(db=db, skip=skip, limit=limit, is_used=is_used)

@router.get("/activation-keys/stats")
def get_activation_key_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get activation key statistics (admin/owner only).
    """
    total_keys = db.query(func.count(ActivationKey.id)).scalar()
    used_keys = db.query(func.count(ActivationKey.id)).filter(ActivationKey.is_used == True).scalar()
    unused_keys = total_keys - used_keys
    
    return {
        "total_keys": total_keys,
        "used_keys": used_keys,
        "unused_keys": unused_keys
    } 