from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
import json

from ..database import get_db
from .. import crud, schemas, auth
from ..models import User
from ..permissions import require_paid_user, can_create_questions

router = APIRouter(prefix="/questions", tags=["questions"])

@router.get("/", response_model=List[schemas.QuestionResponse])
def get_questions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    year: Optional[int] = Query(None, description="Filter by year"),
    course: Optional[str] = Query(None, description="Filter by course"),
    speciality: Optional[str] = Query(None, description="Filter by speciality"),
    chapter: Optional[str] = Query(None, description="Filter by chapter"),
    current_user: User = Depends(require_paid_user),
    db: Session = Depends(get_db)
):
    """
    Get questions with optional filtering by year, course, speciality, and chapter.
    Only paid users can access questions.
    """
    questions = crud.get_questions(db, skip=skip, limit=limit, year=year, course=course, speciality=speciality, chapter=chapter)
    
    result = []
    for question in questions:
        # Create response based on user payment status
        question_response = schemas.QuestionResponse(
            id=question.id,
            year=question.year,
            course=question.course,
            speciality=question.speciality,
            chapter=question.chapter,
            number=question.number,
            question_text=question.question_text,
            created_at=question.created_at,
            updated_at=question.updated_at,
            answers=question.answers,
            correct_answers=question.correct_answers if current_user.is_paid else None
        )
        result.append(question_response)
    
    return result

@router.get("/{question_id}", response_model=schemas.QuestionResponse)
def get_question(
    question_id: int,
    current_user: User = Depends(require_paid_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific question by ID.
    Only paid users can access questions.
    """
    question = crud.get_question(db, question_id=question_id)
    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    return schemas.QuestionResponse(
        id=question.id,
        year=question.year,
        course=question.course,
        speciality=question.speciality,
        chapter=question.chapter,
        number=question.number,
        question_text=question.question_text,
        created_at=question.created_at,
        updated_at=question.updated_at,
        answers=question.answers,
        correct_answers=question.correct_answers if current_user.is_paid else None
    )

@router.get("/courses/list")
def get_available_courses(
    current_user: User = Depends(require_paid_user),
    db: Session = Depends(get_db)
):
    """
    Get list of available courses.
    Only paid users can access.
    """
    courses = db.query(crud.models.Question.course).distinct().all()
    return {"courses": [course[0] for course in courses]}

@router.get("/years/list")
def get_available_years(
    current_user: User = Depends(require_paid_user),
    db: Session = Depends(get_db)
):
    """
    Get list of available years.
    Only paid users can access.
    """
    years = db.query(crud.models.Question.year).distinct().order_by(crud.models.Question.year).all()
    return {"years": [year[0] for year in years]}

@router.get("/specialities/list")
def get_available_specialities(
    current_user: User = Depends(require_paid_user),
    db: Session = Depends(get_db)
):
    """
    Get list of available specialities.
    Only paid users can access.
    """
    specialities = db.query(crud.models.Question.speciality).distinct().filter(crud.models.Question.speciality != None).all()
    return {"specialities": [spec[0] for spec in specialities]}

@router.get("/chapters/list")
def get_available_chapters(
    current_user: User = Depends(require_paid_user),
    db: Session = Depends(get_db)
):
    """
    Get list of available chapters.
    Only paid users can access.
    """
    chapters = db.query(crud.models.Question.chapter).distinct().filter(crud.models.Question.chapter != None).all()
    return {"chapters": [chapter[0] for chapter in chapters]}

# Manager/Admin endpoints for managing questions
@router.post("/", response_model=schemas.Question)
def create_question(
    question: schemas.QuestionCreate,
    current_user: User = Depends(can_create_questions),
    db: Session = Depends(get_db)
):
    """
    Create a new question (manager or admin only).
    """
    return crud.create_question(db=db, question=question)

@router.post("/import")
async def import_questions(
    file: UploadFile = File(...),
    current_user: User = Depends(can_create_questions),
    db: Session = Depends(get_db)
):
    """
    Import questions from a JSON file (manager or admin only).
    """
    if not file.filename.endswith('.json'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a JSON file"
        )
    
    try:
        content = await file.read()
        questions_data = json.loads(content)
        
        if not isinstance(questions_data, list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="JSON file must contain a list of questions"
            )
        
        imported_count = 0
        skipped_count = 0
        errors = []
        
        for i, question_data in enumerate(questions_data):
            try:
                # Validate required fields
                required_fields = ['year', 'course', 'speciality', 'chapter', 'number', 'question_text', 'answers']
                for field in required_fields:
                    if field not in question_data:
                        errors.append(f"Question {i+1}: Missing required field '{field}'")
                        continue
                
                # Check if question already exists
                existing = crud.get_question_by_details(
                    db, 
                    year=question_data['year'],
                    course=question_data['course'],
                    number=question_data['number']
                )
                
                if existing:
                    skipped_count += 1
                    continue
                
                # Create question schema
                question_create = schemas.QuestionCreate(
                    year=question_data['year'],
                    course=question_data['course'],
                    speciality=question_data['speciality'],
                    chapter=question_data['chapter'],
                    number=question_data['number'],
                    question_text=question_data['question_text'],
                    answers=question_data['answers']
                )
                
                # Create question
                crud.create_question(db=db, question=question_create)
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Question {i+1}: {str(e)}")
        
        return {
            "message": "Import completed",
            "imported": imported_count,
            "skipped": skipped_count,
            "errors": errors
        }
        
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON file"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import failed: {str(e)}"
        )

@router.put("/{question_id}", response_model=schemas.Question)
def update_question(
    question_id: int,
    question_update: schemas.QuestionUpdate,
    current_user: User = Depends(can_create_questions),
    db: Session = Depends(get_db)
):
    """
    Update a question (manager or admin only).
    """
    question = crud.update_question(db=db, question_id=question_id, question_update=question_update)
    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    return question

@router.delete("/{question_id}")
def delete_question(
    question_id: int,
    current_user: User = Depends(can_create_questions),
    db: Session = Depends(get_db)
):
    """
    Delete a question (manager or admin only).
    """
    success = crud.delete_question(db=db, question_id=question_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    return {"message": "Question deleted successfully"} 