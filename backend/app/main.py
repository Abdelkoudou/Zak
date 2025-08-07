from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routers import auth, questions, users, admin

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MCQ Study App API",
    description="A FastAPI backend for MCQ study application with authentication and question management",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(questions.router)
app.include_router(users.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to MCQ Study App API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"} 