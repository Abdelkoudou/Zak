# MCQ Study App - Backend API

A comprehensive FastAPI backend for a Medical MCQ (Multiple Choice Questions) study application, specifically designed for French medical education structure.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Question Endpoints](#question-endpoints)
  - [User Management Endpoints](#user-management-endpoints)
  - [Admin Endpoints](#admin-endpoints)
- [Data Structures](#data-structures)
- [User Roles and Permissions](#user-roles-and-permissions)
- [Security Features](#security-features)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)

## Overview

This backend API serves a medical education platform that supports the French medical curriculum structure with proper years, modules, units, and exam types. It provides:

- User authentication and authorization with JWT tokens
- Role-based access control (Owner, Admin, Manager, Student)
- Question management with filtering capabilities
- Activation key system for user subscription
- Device session management (max 2 devices per user)
- Complete CRUD operations for questions and answers

## Features

### For Students
- Access to MCQ questions filtered by year, module, unit, and exam type
- Support for questions with images
- Subscription-based access using activation keys
- Device management (up to 2 devices)
- Password management

### For Managers/Admins
- Create, update, and delete questions
- Import questions from JSON files
- Manage users and activation keys
- View statistics and analytics
- User management capabilities

### Medical Structure Support

**1st Year** - Individual modules with specific exam types:
- Anatomie, Biochimie, Biophysique, Biostatistique/Informatique, Chimie, Cytologie (EMD1, EMD2, Rattrapage)
- Embryologie, Histologie, Physiologie, S.S.H (EMD, Rattrapage)

**2nd Year** - Organized by units (unités):
- Appareil Cardio-vasculaire et Respiratoire
- Appareil Digestif
- Appareil Urinaire
- Appareil Endocrinien et de la Reproduction
- Appareil Nerveux et Organes des Sens
- Standalone modules: Génétique, Immunologie

**3rd Year** - Organized by units (unités):
- Appareil Cardio-vasculaire et Appareil Respiratoire
- Psychologie Médicale et Semiologie Générale
- Appareil Neurologique
- Appareil Endocrinien
- Appareil Urinaire
- Appareil Digestif
- Standalone modules: Anatomie pathologique, Immunologie, Pharmacologie, Microbiologie, Parasitologie

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)
- SQLite (included with Python) or PostgreSQL for production

### Step 1: Clone the Repository

```bash
cd backend
```

### Step 2: Create Virtual Environment (Recommended)

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

The `requirements.txt` includes:
- **fastapi**: Modern web framework for building APIs
- **uvicorn**: ASGI server for running FastAPI
- **sqlalchemy**: SQL toolkit and ORM
- **pydantic**: Data validation using Python type annotations
- **python-jose**: JWT token handling
- **passlib**: Password hashing
- **python-multipart**: File upload support
- **alembic**: Database migration tool
- **psycopg2-binary**: PostgreSQL adapter (for production)
- **python-dotenv**: Environment variable management
- **email-validator**: Email validation

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=sqlite:///./mcq_study.db
SECRET_KEY=your-secret-key-here-make-it-long-and-random
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Configuration Parameters:

- **DATABASE_URL**: Database connection string
  - SQLite (development): `sqlite:///./mcq_study.db`
  - PostgreSQL (production): `postgresql://username:password@localhost:5432/dbname`
- **SECRET_KEY**: Secret key for JWT token signing (use a long random string)
- **ALGORITHM**: Algorithm for JWT encoding (default: HS256)
- **ACCESS_TOKEN_EXPIRE_MINUTES**: Token expiration time in minutes (default: 30)

### Example Environment File

An example configuration file is provided at `env_example.txt`.

## Database Setup

### Initial Setup

The application uses SQLAlchemy ORM with support for database migrations via Alembic.

#### Option 1: Automatic Setup (First Run)

On the first run, the application will automatically create all necessary tables.

```bash
python run.py
```

#### Option 2: Manual Setup with Alembic

```bash
# Initialize database with migrations
alembic upgrade head
```

### Creating the Owner User

An owner user is required to manage the system. Use the provided script:

```bash
python scripts/create_owner.py
```

Follow the prompts to create the owner account. The owner has full system privileges.

### Seeding Sample Data (Optional)

For development/testing, you can populate the database with sample data:

```bash
python scripts/seed_data.py
```

This creates sample users and questions for testing.

## Running the Application

### Development Server

```bash
python run.py
```

The server will start at `http://localhost:8000` with auto-reload enabled.

### Production Server

For production, use uvicorn directly with more workers:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Accessing API Documentation

Once the server is running, you can access:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## API Documentation

All endpoints require JSON content type unless specified otherwise.

### Authentication Endpoints

#### 1. Register New User

**Endpoint**: `POST /auth/register`

**Description**: Create a new user account.

**Request Body**:
```json
{
  "email": "student@example.com",
  "username": "student123",
  "password": "securepassword123",
  "year_of_study": 2,
  "speciality": "Médecine"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "email": "student@example.com",
  "username": "student123",
  "user_type": "student",
  "is_paid": false,
  "year_of_study": 2,
  "speciality": "Médecine",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": null
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "username": "student123",
    "password": "securepassword123",
    "year_of_study": 2,
    "speciality": "Médecine"
  }'
```

#### 2. Login

**Endpoint**: `POST /auth/token`

**Description**: Authenticate and receive access token.

**Request Body** (form-urlencoded):
```
username=student@example.com
password=securepassword123
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=student@example.com&password=securepassword123"
```

#### 3. Get Current User

**Endpoint**: `GET /auth/me`

**Description**: Get current authenticated user details.

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "id": 1,
  "email": "student@example.com",
  "username": "student123",
  "user_type": "student",
  "is_paid": false,
  "year_of_study": 2,
  "speciality": "Médecine",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": null
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Question Endpoints

All question endpoints require authentication and paid user status.

#### 4. Get Questions with Filters

**Endpoint**: `GET /questions/`

**Description**: Retrieve questions with optional filtering.

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `skip` (int, default: 0): Pagination offset
- `limit` (int, default: 100, max: 1000): Number of results
- `year` (int, optional): Filter by exam year (e.g., 2024)
- `study_year` (int, optional): Filter by study year (1, 2, or 3)
- `module` (string, optional): Filter by module name
- `unite` (string, optional): Filter by unit name
- `speciality` (string, optional): Filter by speciality
- `cours` (string, optional): Filter by course name
- `exam_type` (string, optional): Filter by exam type (EMD, EMD1, EMD2, Rattrapage)

**Response**:
```json
[
  {
    "id": 1,
    "year": 2024,
    "study_year": 2,
    "module": "Anatomie",
    "unite": "Appareil Cardio-vasculaire et Respiratoire",
    "speciality": "Médecine",
    "cours": ["Anatomie du coeur", "Vascularisation"],
    "exam_type": "EMD",
    "number": 1,
    "question_text": "Quelle est la structure du coeur?",
    "question_image": null,
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": null,
    "answers": [
      {
        "id": 1,
        "question_id": 1,
        "answer_text": "4 cavités",
        "answer_image": null,
        "is_correct": true,
        "option_label": "a",
        "created_at": "2024-01-01T10:00:00Z"
      },
      {
        "id": 2,
        "question_id": 1,
        "answer_text": "2 cavités",
        "answer_image": null,
        "is_correct": false,
        "option_label": "b",
        "created_at": "2024-01-01T10:00:00Z"
      }
    ],
    "correct_answers": [
      {
        "id": 1,
        "question_id": 1,
        "answer_text": "4 cavités",
        "answer_image": null,
        "is_correct": true,
        "option_label": "a",
        "created_at": "2024-01-01T10:00:00Z"
      }
    ]
  }
]
```

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/questions/?study_year=2&module=Anatomie&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 5. Get Single Question

**Endpoint**: `GET /questions/{question_id}`

**Description**: Get a specific question by ID.

**Headers**: `Authorization: Bearer {token}`

**Path Parameters**:
- `question_id` (int): Question ID

**Response**: Same as individual question in list response

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/questions/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 6. Get Medical Structure

**Endpoint**: `GET /questions/structure`

**Description**: Get the complete French medical education structure (no authentication required).

**Response**:
```json
{
  "study_years": {
    "1": "1ère Année",
    "2": "2ème Année",
    "3": "3ème Année"
  },
  "exam_types": {
    "EMD": "EMD",
    "EMD1": "EMD1",
    "EMD2": "EMD2",
    "RATTRAPAGE": "Rattrapage"
  },
  "first_year": {
    "modules": {
      "Anatomie": ["EMD1", "EMD2", "RATTRAPAGE"],
      "Biochimie": ["EMD1", "EMD2", "RATTRAPAGE"],
      ...
    }
  },
  "second_year": {
    "unites": {
      "Appareil Cardio-vasculaire et Respiratoire": [
        "Anatomie", "Histologie", "Physiologie", "Biophysique"
      ],
      ...
    },
    "modules_standalone": ["Génétique", "Immunologie"]
  },
  "third_year": {
    ...
  }
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/questions/structure"
```

#### 7. Get Available Modules

**Endpoint**: `GET /questions/modules/list`

**Description**: Get list of all modules in the database.

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "modules": ["Anatomie", "Biochimie", "Physiologie", ...]
}
```

#### 8. Get Available Units

**Endpoint**: `GET /questions/unites/list`

**Description**: Get list of all units in the database.

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "unites": ["Appareil Cardio-vasculaire et Respiratoire", ...]
}
```

#### 9. Get Available Courses

**Endpoint**: `GET /questions/cours/list`

**Description**: Get list of all courses in the database.

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "cours": ["Anatomie du coeur", "Physiologie rénale", ...]
}
```

#### 10. Get Available Years

**Endpoint**: `GET /questions/years/list`

**Description**: Get list of exam years in the database.

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "years": [2022, 2023, 2024]
}
```

#### 11. Get Available Study Years

**Endpoint**: `GET /questions/study-years/list`

**Description**: Get list of study years in the database.

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "study_years": [1, 2, 3]
}
```

#### 12. Create Question (Manager/Admin Only)

**Endpoint**: `POST /questions/`

**Description**: Create a new question with answers.

**Headers**: 
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Permissions**: Manager or Admin role required

**Request Body**:
```json
{
  "year": 2024,
  "study_year": 2,
  "module": "Anatomie",
  "unite": "Appareil Cardio-vasculaire et Respiratoire",
  "speciality": "Médecine",
  "cours": ["Anatomie du coeur"],
  "exam_type": "EMD",
  "number": 1,
  "question_text": "Quelle est la structure du coeur?",
  "question_image": null,
  "answers": [
    {
      "answer_text": "4 cavités",
      "answer_image": null,
      "is_correct": true,
      "option_label": "a"
    },
    {
      "answer_text": "2 cavités",
      "answer_image": null,
      "is_correct": false,
      "option_label": "b"
    }
  ]
}
```

**Response** (201 Created): Created question object

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/questions/" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2024,
    "study_year": 2,
    "module": "Anatomie",
    "speciality": "Médecine",
    "cours": ["Test Course"],
    "exam_type": "EMD",
    "number": 1,
    "question_text": "Test question?",
    "answers": [
      {"answer_text": "Answer A", "is_correct": true, "option_label": "a"},
      {"answer_text": "Answer B", "is_correct": false, "option_label": "b"}
    ]
  }'
```

#### 13. Import Questions (Manager/Admin Only)

**Endpoint**: `POST /questions/import`

**Description**: Import multiple questions from a JSON file.

**Headers**: 
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Permissions**: Manager or Admin role required

**Request**: Multipart form with JSON file

**JSON File Format**:
```json
[
  {
    "year": 2024,
    "study_year": 2,
    "module": "Anatomie",
    "unite": "Appareil Cardio-vasculaire et Respiratoire",
    "speciality": "Médecine",
    "cours": ["Anatomie du coeur"],
    "exam_type": "EMD",
    "number": 1,
    "question_text": "Question text here?",
    "question_image": null,
    "answers": [
      {
        "answer_text": "Answer A",
        "answer_image": null,
        "is_correct": true,
        "option_label": "a"
      }
    ]
  }
]
```

**Response**:
```json
{
  "message": "Import completed",
  "imported": 10,
  "skipped": 2,
  "errors": ["Question 5: Missing required field 'module'"]
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/questions/import" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@questions.json"
```

**Script for Importing**:
```bash
python scripts/import_questions.py path/to/questions.json
```

#### 14. Update Question (Manager/Admin Only)

**Endpoint**: `PUT /questions/{question_id}`

**Description**: Update an existing question.

**Headers**: 
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Permissions**: Manager or Admin role required

**Path Parameters**:
- `question_id` (int): Question ID

**Request Body** (all fields optional):
```json
{
  "question_text": "Updated question text?",
  "answers": [
    {
      "answer_text": "Updated answer",
      "is_correct": true,
      "option_label": "a"
    }
  ]
}
```

**Response**: Updated question object

**cURL Example**:
```bash
curl -X PUT "http://localhost:8000/questions/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"question_text": "Updated question?"}'
```

#### 15. Delete Question (Manager/Admin Only)

**Endpoint**: `DELETE /questions/{question_id}`

**Description**: Delete a question.

**Headers**: `Authorization: Bearer {token}`

**Permissions**: Manager or Admin role required

**Path Parameters**:
- `question_id` (int): Question ID

**Response**:
```json
{
  "message": "Question deleted successfully"
}
```

**cURL Example**:
```bash
curl -X DELETE "http://localhost:8000/questions/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### User Management Endpoints

#### 16. Activate Account with Key

**Endpoint**: `POST /users/activate`

**Description**: Activate user account using an activation key.

**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "key": "ACTIVATION-KEY-HERE"
}
```

**Response**:
```json
{
  "message": "Account activated successfully",
  "user_id": 1,
  "is_paid": true,
  "expires_at": "2025-01-01T10:00:00Z"
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/users/activate" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"key": "YOUR-ACTIVATION-KEY"}'
```

#### 17. Change Password

**Endpoint**: `POST /users/change-password`

**Description**: Change user password.

**Request Body**:
```json
{
  "email": "student@example.com",
  "current_password": "oldpassword123",
  "new_password": "newpassword456"
}
```

**Response**:
```json
{
  "message": "Password changed successfully"
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/users/change-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "current_password": "old123",
    "new_password": "new456"
  }'
```

#### 18. Get User Devices

**Endpoint**: `GET /users/devices`

**Description**: Get all active device sessions for current user.

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
[
  {
    "id": 1,
    "user_id": 1,
    "device_fingerprint": "abc123def456",
    "device_name": "My iPhone",
    "is_active": true,
    "created_at": "2024-01-01T10:00:00Z",
    "last_seen": "2024-01-15T14:30:00Z"
  }
]
```

#### 19. Register Device

**Endpoint**: `POST /users/devices`

**Description**: Register a new device (max 2 devices per user).

**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "device_fingerprint": "unique-device-id",
  "device_name": "My iPad"
}
```

**Response**: Created device session object

#### 20. Deactivate Device

**Endpoint**: `DELETE /users/devices/{device_id}`

**Description**: Deactivate a device session.

**Headers**: `Authorization: Bearer {token}`

**Path Parameters**:
- `device_id` (int): Device session ID

**Response**:
```json
{
  "message": "Device deactivated successfully"
}
```

#### 21. Get User by ID

**Endpoint**: `GET /users/{user_id}`

**Description**: Get user details. Users can only view their own profile unless they're manager/admin.

**Headers**: `Authorization: Bearer {token}`

**Path Parameters**:
- `user_id` (int): User ID

**Response**: User object

#### 22. Update User

**Endpoint**: `PUT /users/{user_id}`

**Description**: Update user profile. Users can update their own profile; managers/admins can update others.

**Headers**: `Authorization: Bearer {token}`

**Path Parameters**:
- `user_id` (int): User ID

**Request Body** (all fields optional):
```json
{
  "email": "newemail@example.com",
  "username": "newusername",
  "year_of_study": 3,
  "speciality": "Chirurgie"
}
```

**Response**: Updated user object

#### 23. Delete User

**Endpoint**: `DELETE /users/{user_id}`

**Description**: Delete user account. Users can only delete their own account unless they're admin.

**Headers**: `Authorization: Bearer {token}`

**Path Parameters**:
- `user_id` (int): User ID

**Response**:
```json
{
  "message": "User deleted successfully"
}
```

#### 24. Get All Users (Manager/Admin Only)

**Endpoint**: `GET /users/`

**Description**: Get all users.

**Headers**: `Authorization: Bearer {token}`

**Permissions**: Manager or Admin role required

**Query Parameters**:
- `skip` (int, default: 0): Pagination offset
- `limit` (int, default: 100): Number of results

**Response**: Array of user objects

### Admin Endpoints

All admin endpoints require Admin or Owner role.

#### 25. Get Dashboard Statistics

**Endpoint**: `GET /admin/dashboard`

**Description**: Get comprehensive dashboard statistics.

**Headers**: `Authorization: Bearer {token}`

**Permissions**: Admin or Owner role required

**Response**:
```json
{
  "user_stats": {
    "total_users": 150,
    "paid_users": 120,
    "unpaid_users": 30,
    "owner_users": 1,
    "admin_users": 2,
    "manager_users": 5,
    "student_users": 142
  },
  "question_stats": {
    "total_questions": 500,
    "total_answers": 2000,
    "average_answers_per_question": 4
  },
  "activation_key_stats": {
    "total_keys": 200,
    "used_keys": 120,
    "unused_keys": 80
  },
  "course_stats": [
    {"course": "Anatomie du coeur", "count": 50}
  ],
  "speciality_stats": [
    {"speciality": "Médecine", "count": 450}
  ],
  "year_stats": [
    {"year": 2024, "count": 200}
  ]
}
```

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/admin/dashboard" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

#### 26. Get All Users with Filters (Manager/Admin Only)

**Endpoint**: `GET /admin/users`

**Description**: Get all users with filtering options.

**Headers**: `Authorization: Bearer {token}`

**Permissions**: Manager or Admin role required

**Query Parameters**:
- `skip` (int, default: 0): Pagination offset
- `limit` (int, default: 100, max: 1000): Number of results
- `user_type` (string, optional): Filter by user type (owner, admin, manager, student)
- `is_paid` (boolean, optional): Filter by payment status

**Response**: Array of user objects

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/admin/users?user_type=student&is_paid=true" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

#### 27. Update User Payment Status (Manager/Admin Only)

**Endpoint**: `PUT /admin/users/{user_id}/payment`

**Description**: Update user payment status.

**Headers**: `Authorization: Bearer {token}`

**Permissions**: Manager or Admin role required

**Path Parameters**:
- `user_id` (int): User ID

**Query Parameters**:
- `is_paid` (boolean): Payment status

**Response**:
```json
{
  "message": "User payment status updated successfully",
  "user_id": 1,
  "is_paid": true
}
```

**cURL Example**:
```bash
curl -X PUT "http://localhost:8000/admin/users/1/payment?is_paid=true" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

#### 28. Update User Role (Admin Only)

**Endpoint**: `PUT /admin/users/{user_id}/role`

**Description**: Update user role.

**Headers**: `Authorization: Bearer {token}`

**Permissions**: Admin or Owner role required

**Path Parameters**:
- `user_id` (int): User ID

**Query Parameters**:
- `user_type` (string): New user type (owner, admin, manager, student)

**Response**:
```json
{
  "message": "User role updated successfully",
  "user_id": 1,
  "user_type": "manager"
}
```

**cURL Example**:
```bash
curl -X PUT "http://localhost:8000/admin/users/1/role?user_type=manager" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

#### 29. Get User Detailed Info (Manager/Admin Only)

**Endpoint**: `GET /admin/users/{user_id}/details`

**Description**: Get detailed user information.

**Headers**: `Authorization: Bearer {token}`

**Permissions**: Manager or Admin role required

**Path Parameters**:
- `user_id` (int): User ID

**Response**: User object with detailed information

#### 30. Delete User (Admin Only)

**Endpoint**: `DELETE /admin/users/{user_id}`

**Description**: Delete a user account.

**Headers**: `Authorization: Bearer {token}`

**Permissions**: Admin or Owner role required

**Path Parameters**:
- `user_id` (int): User ID

**Response**:
```json
{
  "message": "User deleted successfully"
}
```

#### 31. Create Activation Key

**Endpoint**: `POST /admin/activation-keys`

**Description**: Generate a new activation key.

**Headers**: `Authorization: Bearer {token}`

**Permissions**: Admin or Owner role required

**Response**:
```json
{
  "id": 1,
  "key": "ABCD-EFGH-IJKL-MNOP",
  "user_id": null,
  "is_used": false,
  "created_by": 1,
  "created_at": "2024-01-01T10:00:00Z",
  "used_at": null,
  "expires_at": null
}
```

**cURL Example**:
```bash
curl -X POST "http://localhost:8000/admin/activation-keys" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

#### 32. Get Activation Keys

**Endpoint**: `GET /admin/activation-keys`

**Description**: Get all activation keys with optional filtering.

**Headers**: `Authorization: Bearer {token}`

**Permissions**: Admin or Owner role required

**Query Parameters**:
- `skip` (int, default: 0): Pagination offset
- `limit` (int, default: 100, max: 1000): Number of results
- `is_used` (boolean, optional): Filter by usage status

**Response**: Array of activation key objects

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/admin/activation-keys?is_used=false" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

#### 33. Get Activation Key Statistics

**Endpoint**: `GET /admin/activation-keys/stats`

**Description**: Get activation key statistics.

**Headers**: `Authorization: Bearer {token}`

**Permissions**: Admin or Owner role required

**Response**:
```json
{
  "total_keys": 200,
  "used_keys": 120,
  "unused_keys": 80
}
```

## Data Structures

### User Object

```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username123",
  "user_type": "student",
  "is_paid": false,
  "year_of_study": 2,
  "speciality": "Médecine",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```

### Question Object

```json
{
  "id": 1,
  "year": 2024,
  "study_year": 2,
  "module": "Anatomie",
  "unite": "Appareil Cardio-vasculaire et Respiratoire",
  "speciality": "Médecine",
  "cours": ["Anatomie du coeur", "Vascularisation"],
  "exam_type": "EMD",
  "number": 1,
  "question_text": "Question text here?",
  "question_image": "/path/to/image.jpg",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": null,
  "answers": [...],
  "correct_answers": [...]
}
```

### Answer Object

```json
{
  "id": 1,
  "question_id": 1,
  "answer_text": "Answer text here",
  "answer_image": "/path/to/image.jpg",
  "is_correct": true,
  "option_label": "a",
  "created_at": "2024-01-01T10:00:00Z"
}
```

### Activation Key Object

```json
{
  "id": 1,
  "key": "ABCD-EFGH-IJKL-MNOP",
  "user_id": 5,
  "is_used": true,
  "created_by": 1,
  "created_at": "2024-01-01T10:00:00Z",
  "used_at": "2024-01-05T12:00:00Z",
  "expires_at": "2025-01-05T12:00:00Z"
}
```

### Device Session Object

```json
{
  "id": 1,
  "user_id": 1,
  "device_fingerprint": "abc123def456",
  "device_name": "My iPhone",
  "is_active": true,
  "created_at": "2024-01-01T10:00:00Z",
  "last_seen": "2024-01-15T14:30:00Z"
}
```

## User Roles and Permissions

### Role Hierarchy

1. **Owner** - Full system access
   - All admin capabilities
   - Cannot be edited or deleted by anyone else
   - Can change user roles
   - Protected from modification

2. **Admin** - Administrative access
   - Manage all users (except owners)
   - Generate activation keys
   - View dashboard statistics
   - Manage questions
   - Change user roles (except to/from owner)

3. **Manager** - Content management
   - Create, update, delete questions
   - Import questions
   - View and manage users
   - Update payment status
   - Cannot generate activation keys
   - Cannot change user roles

4. **Student** - Standard user
   - Access questions (if paid)
   - Manage own profile
   - Manage own devices (max 2)
   - Change own password
   - Use activation keys

### Permission Matrix

| Action | Owner | Admin | Manager | Student |
|--------|-------|-------|---------|---------|
| View questions | ✓ (if paid) | ✓ (if paid) | ✓ (if paid) | ✓ (if paid) |
| Create questions | ✓ | ✓ | ✓ | ✗ |
| Update questions | ✓ | ✓ | ✓ | ✗ |
| Delete questions | ✓ | ✓ | ✓ | ✗ |
| Import questions | ✓ | ✓ | ✓ | ✗ |
| Generate activation keys | ✓ | ✓ | ✗ | ✗ |
| View all users | ✓ | ✓ | ✓ | ✗ |
| Update user payment | ✓ | ✓ | ✓ | ✗ |
| Change user roles | ✓ | ✓ | ✗ | ✗ |
| View dashboard | ✓ | ✓ | ✗ | ✗ |
| Delete users | ✓ | ✓ | ✗ | Own only |
| Manage devices | ✓ | ✓ | ✓ | ✓ (own) |

## Security Features

### Authentication
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt hashing for passwords
- **Token Expiration**: Configurable token expiration (default 30 minutes)

### Authorization
- **Role-Based Access Control**: Different permissions for each user type
- **Protected Routes**: Endpoints secured based on user role
- **Owner Protection**: Owner users cannot be modified by anyone else

### Data Protection
- **Payment-Based Access**: Questions only accessible to paid users
- **Correct Answers**: Hidden from unpaid users
- **Input Validation**: Pydantic schemas for request validation
- **SQL Injection Protection**: SQLAlchemy ORM prevents SQL injection

### Rate Limiting
- **Device Limit**: Maximum 2 devices per user
- **Activation Keys**: Single-use activation keys

### CORS
- **Configurable Origins**: CORS middleware for cross-origin requests
- **Production Ready**: Configure allowed origins in production

### Database Security
- **Environment Variables**: Sensitive data in environment variables
- **Password Encryption**: Passwords never stored in plain text
- **Unique Constraints**: Email and username uniqueness enforced

## Scripts

The `scripts/` folder contains utility scripts for database management:

### create_owner.py

Creates the initial owner user account.

```bash
python scripts/create_owner.py
```

Follow the interactive prompts to set up the owner account.

### seed_data.py

Populates the database with sample data for testing.

```bash
python scripts/seed_data.py
```

Creates sample users (admin, manager, students) and questions.

### import_questions.py

Imports questions from a JSON file into the database.

```bash
python scripts/import_questions.py path/to/questions.json
```

**JSON Format**: Same as the `/questions/import` endpoint.

## Troubleshooting

### Issue: "ModuleNotFoundError" when running

**Solution**: Ensure all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Issue: Database connection errors

**Solution**: 
1. Check `.env` file exists and has correct `DATABASE_URL`
2. For SQLite, ensure the directory has write permissions
3. For PostgreSQL, verify database exists and credentials are correct

### Issue: "401 Unauthorized" errors

**Solution**:
1. Ensure you're including the `Authorization` header with a valid token
2. Check token hasn't expired (default 30 minutes)
3. Login again to get a fresh token

### Issue: "403 Forbidden" errors

**Solution**:
1. Check user role has required permissions for the endpoint
2. Verify user is paid (for question endpoints)
3. Ensure you're not trying to modify owner users

### Issue: Cannot create owner user

**Solution**:
1. Use the `create_owner.py` script
2. Ensure database is initialized
3. Check that no owner already exists

### Issue: Questions not visible to users

**Solution**:
1. Verify user has `is_paid = true`
2. Check user is authenticated
3. Ensure questions exist in database

### Issue: Import questions failing

**Solution**:
1. Verify JSON file format matches expected structure
2. Check all required fields are present
3. Ensure file is valid JSON
4. Check user has manager/admin role

### Issue: Cannot activate with key

**Solution**:
1. Verify activation key is valid and not already used
2. Check user is authenticated
3. Ensure key matches exactly (case-sensitive)

### Common Error Codes

- **400 Bad Request**: Invalid input data, check request body
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions for action
- **404 Not Found**: Resource doesn't exist
- **422 Unprocessable Entity**: Validation error, check data types
- **500 Internal Server Error**: Server error, check logs

### Logging

The application logs to console. For production, configure logging:

```python
# In app/main.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Database Migrations

To create a new migration after model changes:

```bash
# Create migration
alembic revision --autogenerate -m "Description of changes"

# Apply migration
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Testing the API

Use the interactive Swagger UI at `http://localhost:8000/docs` to test endpoints with a user-friendly interface.

Or use tools like:
- **curl**: Command-line HTTP client (examples throughout this README)
- **Postman**: GUI API testing tool
- **HTTPie**: User-friendly command-line HTTP client

### Performance Tips

1. **Use Pagination**: Always use `skip` and `limit` parameters for large result sets
2. **Filter Queries**: Use specific filters to reduce data transfer
3. **Index Database**: Ensure database indexes are created (done automatically)
4. **Connection Pooling**: Configure SQLAlchemy pool size for production
5. **Caching**: Consider caching for frequently accessed data

## Contributing

When contributing to this project:

1. Follow existing code style
2. Add appropriate tests
3. Update documentation for new features
4. Create database migrations for model changes
5. Ensure backward compatibility

## License

This project is proprietary. All rights reserved.

## Support

For issues, questions, or feature requests, please contact the system administrator.

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**API Base URL**: http://localhost:8000 (development)
