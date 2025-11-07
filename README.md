# MCQ Study App - Backend API

A comprehensive FastAPI backend application for managing Multiple Choice Questions (MCQ) for French Medical Education. This system supports the complete French medical education structure including study years, modules, units, courses, and exam types.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Medical Education Structure](#medical-education-structure)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Running the Application](#running-the-application)
7. [API Documentation](#api-documentation)
8. [Database Schema](#database-schema)
9. [User Roles and Permissions](#user-roles-and-permissions)
10. [Usage Examples](#usage-examples)
11. [Scripts and Utilities](#scripts-and-utilities)

---

## Overview

This backend API is designed specifically for French medical education, providing a complete system for managing MCQ questions across three years of medical studies (1ère Année, 2ème Année, 3ème Année). The system includes user authentication, role-based access control, activation key management, and comprehensive question filtering.

**Technology Stack:**
- FastAPI - Modern web framework
- SQLAlchemy - ORM for database operations
- Pydantic - Data validation
- JWT - Token-based authentication
- SQLite/PostgreSQL - Database support
- Alembic - Database migrations
- Uvicorn - ASGI server

---

## Features

### For Students
- ✅ Access MCQ questions by year of study (1st, 2nd, 3rd year)
- ✅ Filter questions by module, unit, course, and exam type
- ✅ Support for images in questions and answers
- ✅ Activation key-based access control
- ✅ Multi-device support (up to 2 devices per account)
- ✅ Secure password management

### For Managers/Administrators
- ✅ Create and manage MCQ questions
- ✅ Bulk import questions from JSON files
- ✅ Update and delete questions
- ✅ Generate activation keys
- ✅ User management
- ✅ Dashboard with statistics
- ✅ Role-based access control

### Security Features
- ✅ Password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ CORS middleware for cross-origin requests
- ✅ Input validation with Pydantic schemas
- ✅ Role-based permissions (Owner, Admin, Manager, Student)
- ✅ Device fingerprinting for access control

---

## Medical Education Structure

The system supports the complete French medical education structure:

### 1ère Année (1st Year)

**Modules with EMD1/EMD2/Rattrapage:**
- Anatomie
- Biochimie
- Biophysique
- Biostatistique / Informatique
- Chimie
- Cytologie

**Modules with EMD/Rattrapage:**
- Embryologie
- Histologie
- Physiologie
- S.S.H

### 2ème Année (2nd Year)

**Units (Unités) with 4 modules each:**
1. **Appareil Cardio-vasculaire et Respiratoire**
   - Anatomie, Histologie, Physiologie, Biophysique

2. **Appareil Digestif**
   - Anatomie, Histologie, Physiologie, Biochimie

3. **Appareil Urinaire**
   - Anatomie, Histologie, Physiologie, Biochimie

4. **Appareil Endocrinien et de la Reproduction**
   - Anatomie, Histologie, Physiologie, Biochimie

5. **Appareil Nerveux et Organes des Sens**
   - Anatomie, Histologie, Physiologie, Biophysique

**Standalone Modules:**
- Génétique
- Immunologie

**Exam Types:** EMD, Rattrapage

### 3ème Année (3rd Year)

**Units (Unités) with 4 modules each:**
1. **Appareil Cardio-vasculaire et Appareil Respiratoire**
   - Semiologie, physiopathologie, radiologie, biochimie

2. **Psychologie Médicale et Semiologie Générale**
   - Semiologie, physiopathologie, radiologie, biochimie

3. **Appareil Neurologique**
   - Semiologie, physiopathologie, radiologie, biochimie

4. **Appareil Endocrinien**
   - Semiologie, physiopathologie, radiologie, biochimie

5. **Appareil Urinaire**
   - Semiologie, physiopathologie, radiologie, biochimie

6. **Appareil Digestif**
   - Semiologie, physiopathologie, radiologie, biochimie

**Standalone Modules:**
- Anatomie pathologique
- Immunologie
- Pharmacologie
- Microbiologie
- Parasitologie

**Exam Types:** EMD, Rattrapage

---

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/Abdelkoudou/Zak.git
cd Zak
```

### Step 2: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

The `requirements.txt` includes:
- fastapi==0.104.1
- uvicorn[standard]==0.24.0
- sqlalchemy==2.0.23
- pydantic==2.5.0
- python-jose[cryptography]==3.3.0
- passlib[bcrypt]==1.7.4
- python-multipart==0.0.6
- alembic==1.12.1
- psycopg2-binary==2.9.9
- python-dotenv==1.0.0
- email-validator

### Step 3: Set Up Environment Variables (Optional)

Create a `.env` file in the `backend` directory (see [Configuration](#configuration) section):

```bash
cp env_example.txt .env
```

Edit `.env` with your configuration.

---

## Configuration

The application can be configured using environment variables. Create a `.env` file in the `backend` directory with the following variables:

```env
# Database Configuration
DATABASE_URL=sqlite:///./mcq_study.db
# For PostgreSQL: DATABASE_URL=postgresql://username:password@localhost:5432/mcq_study_db

# JWT Configuration
SECRET_KEY=your-secret-key-here-make-it-long-and-random
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Notes:**
- By default, the application uses SQLite (`mcq_study.db`)
- For production, use PostgreSQL by setting the `DATABASE_URL`
- Generate a secure `SECRET_KEY` for JWT token signing
- `ACCESS_TOKEN_EXPIRE_MINUTES` controls token expiration time

---

## Running the Application

### Development Mode

```bash
cd backend
python run.py
```

The server will start on `http://localhost:8000` with auto-reload enabled.

### Production Mode

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Verify Installation

Open your browser and navigate to:
- API Root: http://localhost:8000
- Interactive API Documentation: http://localhost:8000/docs
- Alternative API Documentation: http://localhost:8000/redoc
- Health Check: http://localhost:8000/health

---

## API Documentation

### Base URL
```
http://localhost:8000
```

### Interactive Documentation
FastAPI provides automatic interactive API documentation:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## API Endpoints

### 1. Authentication Endpoints

#### 1.1. Register a New User
**Endpoint:** `POST /auth/register`

**Description:** Create a new user account.

**Request Body:**
```json
{
  "email": "student@example.com",
  "username": "student123",
  "password": "securepassword123",
  "year_of_study": 2,
  "speciality": "Médecine"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "student@example.com",
  "username": "student123",
  "user_type": "student",
  "is_paid": false,
  "year_of_study": 2,
  "speciality": "Médecine",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": null
}
```

**cURL Example:**
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

---

#### 1.2. Login (Get Access Token)
**Endpoint:** `POST /auth/token`

**Description:** Authenticate and receive a JWT access token.

**Request Body (Form Data):**
```
username=student@example.com
password=securepassword123
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=student@example.com&password=securepassword123"
```

---

#### 1.3. Get Current User Info
**Endpoint:** `GET /auth/me`

**Description:** Get information about the currently authenticated user.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "student@example.com",
  "username": "student123",
  "user_type": "student",
  "is_paid": true,
  "year_of_study": 2,
  "speciality": "Médecine",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-02T10:00:00Z"
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 2. Questions Endpoints (Requires Paid User)

#### 2.1. Get Questions with Filters
**Endpoint:** `GET /questions/`

**Description:** Retrieve questions with optional filtering. Only accessible by paid users.

**Query Parameters:**
- `skip` (integer, optional): Number of records to skip for pagination (default: 0)
- `limit` (integer, optional): Maximum number of records to return (default: 100, max: 1000)
- `year` (integer, optional): Filter by exam year (e.g., 2024)
- `study_year` (integer, optional): Filter by study year (1, 2, or 3)
- `module` (string, optional): Filter by module name
- `unite` (string, optional): Filter by unit name
- `speciality` (string, optional): Filter by speciality
- `cours` (string, optional): Filter by course name
- `exam_type` (string, optional): Filter by exam type (EMD, EMD1, EMD2, Rattrapage)

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "year": 2024,
    "study_year": 2,
    "module": "Anatomie",
    "unite": "Appareil Cardio-vasculaire et Respiratoire",
    "speciality": "Médecine",
    "cours": ["Cardiologie", "Pneumologie"],
    "exam_type": "EMD",
    "number": 1,
    "question_text": "Quelle est la structure anatomique...",
    "question_image": null,
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": null,
    "answers": [
      {
        "id": 1,
        "question_id": 1,
        "answer_text": "L'aorte",
        "answer_image": null,
        "is_correct": true,
        "option_label": "a",
        "created_at": "2024-01-01T12:00:00Z"
      },
      {
        "id": 2,
        "question_id": 1,
        "answer_text": "La veine cave",
        "answer_image": null,
        "is_correct": false,
        "option_label": "b",
        "created_at": "2024-01-01T12:00:00Z"
      }
    ],
    "correct_answers": [
      {
        "id": 1,
        "question_id": 1,
        "answer_text": "L'aorte",
        "answer_image": null,
        "is_correct": true,
        "option_label": "a",
        "created_at": "2024-01-01T12:00:00Z"
      }
    ]
  }
]
```

**cURL Examples:**

Get all questions for 2nd year students:
```bash
curl -X GET "http://localhost:8000/questions/?study_year=2" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Get questions filtered by module and exam type:
```bash
curl -X GET "http://localhost:8000/questions/?study_year=1&module=Anatomie&exam_type=EMD1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Get questions with pagination:
```bash
curl -X GET "http://localhost:8000/questions/?skip=0&limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 2.2. Get Single Question by ID
**Endpoint:** `GET /questions/{question_id}`

**Description:** Retrieve a specific question by its ID.

**Path Parameters:**
- `question_id` (integer): The ID of the question

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK` (Same format as a single question in 2.1)

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/questions/1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 2.3. Get Available Modules
**Endpoint:** `GET /questions/modules/list`

**Description:** Get a list of all available modules in the database.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
{
  "modules": [
    "Anatomie",
    "Biochimie",
    "Physiologie",
    "Génétique",
    "Immunologie"
  ]
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/questions/modules/list" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 2.4. Get Available Units
**Endpoint:** `GET /questions/unites/list`

**Description:** Get a list of all available units (unités) in the database.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
{
  "unites": [
    "Appareil Cardio-vasculaire et Respiratoire",
    "Appareil Digestif",
    "Appareil Urinaire"
  ]
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/questions/unites/list" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 2.5. Get Available Courses
**Endpoint:** `GET /questions/cours/list`

**Description:** Get a list of all available courses in the database.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
{
  "cours": [
    "Cardiologie",
    "Pneumologie",
    "Gastroentérologie"
  ]
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/questions/cours/list" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 2.6. Get Available Years
**Endpoint:** `GET /questions/years/list`

**Description:** Get a list of all available exam years in the database.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
{
  "years": [2020, 2021, 2022, 2023, 2024]
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/questions/years/list" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 2.7. Get Available Study Years
**Endpoint:** `GET /questions/study-years/list`

**Description:** Get a list of all available study years in the database.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
{
  "study_years": [1, 2, 3]
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/questions/study-years/list" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 2.8. Get Medical Education Structure
**Endpoint:** `GET /questions/structure`

**Description:** Get the complete French medical education structure (no authentication required).

**Response:** `200 OK`
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
      "Biochimie": ["EMD1", "EMD2", "RATTRAPAGE"]
    }
  },
  "second_year": {
    "unites": {
      "Appareil Cardio-vasculaire et Respiratoire": [
        "Anatomie", "Histologie", "Physiologie", "Biophysique"
      ]
    },
    "modules_standalone": ["Génétique", "Immunologie"]
  },
  "third_year": {
    "unites": {
      "Appareil Cardio-vasculaire et Appareil Respiratoire": [
        "Semiologie", "physiopathologie", "radiologie", "biochimie"
      ]
    },
    "modules_standalone": [
      "Anatomie pathologique", "Immunologie", "Pharmacologie"
    ]
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/questions/structure"
```

---

### 3. Question Management Endpoints (Manager/Admin Only)

#### 3.1. Create a New Question
**Endpoint:** `POST /questions/`

**Description:** Create a new MCQ question (manager or admin only).

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request Body:**
```json
{
  "year": 2024,
  "study_year": 2,
  "module": "Anatomie",
  "unite": "Appareil Cardio-vasculaire et Respiratoire",
  "speciality": "Médecine",
  "cours": ["Cardiologie", "Anatomie cardiovasculaire"],
  "exam_type": "EMD",
  "number": 1,
  "question_text": "Quelle est la principale fonction de l'aorte?",
  "question_image": null,
  "answers": [
    {
      "answer_text": "Transporter le sang oxygéné du cœur vers le corps",
      "answer_image": null,
      "is_correct": true,
      "option_label": "a"
    },
    {
      "answer_text": "Transporter le sang désoxygéné vers le cœur",
      "answer_image": null,
      "is_correct": false,
      "option_label": "b"
    },
    {
      "answer_text": "Filtrer le sang",
      "answer_image": null,
      "is_correct": false,
      "option_label": "c"
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "year": 2024,
  "study_year": 2,
  "module": "Anatomie",
  "unite": "Appareil Cardio-vasculaire et Respiratoire",
  "speciality": "Médecine",
  "cours": ["Cardiologie", "Anatomie cardiovasculaire"],
  "exam_type": "EMD",
  "number": 1,
  "question_text": "Quelle est la principale fonction de l'aorte?",
  "question_image": null,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": null,
  "answers": [...]
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/questions/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2024,
    "study_year": 2,
    "module": "Anatomie",
    "unite": "Appareil Cardio-vasculaire et Respiratoire",
    "speciality": "Médecine",
    "cours": ["Cardiologie"],
    "exam_type": "EMD",
    "number": 1,
    "question_text": "Question text here",
    "answers": [
      {"answer_text": "Answer A", "is_correct": true, "option_label": "a"},
      {"answer_text": "Answer B", "is_correct": false, "option_label": "b"}
    ]
  }'
```

---

#### 3.2. Import Questions from JSON
**Endpoint:** `POST /questions/import`

**Description:** Import multiple questions from a JSON file (manager or admin only).

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: multipart/form-data
```

**Request Body:** Form data with file upload
- `file`: JSON file containing an array of questions

**JSON File Format:**
```json
[
  {
    "year": 2024,
    "study_year": 2,
    "module": "Anatomie",
    "unite": "Appareil Cardio-vasculaire et Respiratoire",
    "speciality": "Médecine",
    "cours": ["Cardiologie"],
    "exam_type": "EMD",
    "number": 1,
    "question_text": "Question 1?",
    "question_image": null,
    "answers": [
      {"answer_text": "Answer A", "is_correct": true, "option_label": "a"},
      {"answer_text": "Answer B", "is_correct": false, "option_label": "b"}
    ]
  },
  {
    "year": 2024,
    "study_year": 2,
    "module": "Anatomie",
    "unite": "Appareil Cardio-vasculaire et Respiratoire",
    "speciality": "Médecine",
    "cours": ["Pneumologie"],
    "exam_type": "EMD",
    "number": 2,
    "question_text": "Question 2?",
    "answers": [...]
  }
]
```

**Response:** `200 OK`
```json
{
  "message": "Import completed",
  "imported": 10,
  "skipped": 2,
  "errors": [
    "Question 3: Missing required field 'module'"
  ]
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/questions/import" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@questions.json"
```

---

#### 3.3. Update a Question
**Endpoint:** `PUT /questions/{question_id}`

**Description:** Update an existing question (manager or admin only).

**Path Parameters:**
- `question_id` (integer): The ID of the question to update

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request Body:** (All fields optional)
```json
{
  "question_text": "Updated question text?",
  "year": 2024,
  "exam_type": "EMD1"
}
```

**Response:** `200 OK` (Updated question object)

**cURL Example:**
```bash
curl -X PUT "http://localhost:8000/questions/1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question_text": "Updated question?"}'
```

---

#### 3.4. Delete a Question
**Endpoint:** `DELETE /questions/{question_id}`

**Description:** Delete a question (manager or admin only).

**Path Parameters:**
- `question_id` (integer): The ID of the question to delete

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
{
  "message": "Question deleted successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE "http://localhost:8000/questions/1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 4. User Management Endpoints

#### 4.1. Get All Users
**Endpoint:** `GET /users/`

**Description:** Get a list of all users (manager or admin only).

**Query Parameters:**
- `skip` (integer, optional): Number of records to skip (default: 0)
- `limit` (integer, optional): Maximum records to return (default: 100)

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "email": "student@example.com",
    "username": "student123",
    "user_type": "student",
    "is_paid": true,
    "year_of_study": 2,
    "speciality": "Médecine",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": null
  }
]
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/users/?skip=0&limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 4.2. Activate Account with Key
**Endpoint:** `POST /users/activate`

**Description:** Activate a user account using an activation key.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request Body:**
```json
{
  "key": "ACTIVATION-KEY-HERE"
}
```

**Response:** `200 OK`
```json
{
  "message": "Account activated successfully",
  "user_id": 1,
  "is_paid": true,
  "expires_at": "2025-01-01T12:00:00Z"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/users/activate" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key": "YOUR-ACTIVATION-KEY"}'
```

---

#### 4.3. Change Password
**Endpoint:** `POST /users/change-password`

**Description:** Change user password by providing email, current password, and new password.

**Request Body:**
```json
{
  "email": "student@example.com",
  "current_password": "oldpassword123",
  "new_password": "newpassword456"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password changed successfully"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/users/change-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "current_password": "oldpassword",
    "new_password": "newpassword"
  }'
```

---

#### 4.4. Get User Devices
**Endpoint:** `GET /users/devices`

**Description:** Get all active device sessions for the current user.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "user_id": 1,
    "device_fingerprint": "device-fingerprint-hash",
    "device_name": "iPhone 12",
    "is_active": true,
    "created_at": "2024-01-01T12:00:00Z",
    "last_seen": "2024-01-05T10:00:00Z"
  }
]
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/users/devices" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 4.5. Register a Device
**Endpoint:** `POST /users/devices`

**Description:** Register a new device for the current user (max 2 devices).

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request Body:**
```json
{
  "device_fingerprint": "unique-device-id-hash",
  "device_name": "Samsung Galaxy S21"
}
```

**Response:** `200 OK`
```json
{
  "id": 2,
  "user_id": 1,
  "device_fingerprint": "unique-device-id-hash",
  "device_name": "Samsung Galaxy S21",
  "is_active": true,
  "created_at": "2024-01-05T12:00:00Z",
  "last_seen": "2024-01-05T12:00:00Z"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/users/devices" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_fingerprint": "device-id-hash",
    "device_name": "My Phone"
  }'
```

---

#### 4.6. Deactivate a Device
**Endpoint:** `DELETE /users/devices/{device_id}`

**Description:** Deactivate a device session.

**Path Parameters:**
- `device_id` (integer): The ID of the device to deactivate

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
{
  "message": "Device deactivated successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE "http://localhost:8000/users/devices/1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 4.7. Get User by ID
**Endpoint:** `GET /users/{user_id}`

**Description:** Get a specific user by ID. Users can only access their own profile unless they're manager/admin.

**Path Parameters:**
- `user_id` (integer): The ID of the user

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK` (User object)

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/users/1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 4.8. Update User Profile
**Endpoint:** `PUT /users/{user_id}`

**Description:** Update a user profile. Users can only update their own profile unless they're manager/admin.

**Path Parameters:**
- `user_id` (integer): The ID of the user

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request Body:** (All fields optional)
```json
{
  "email": "newemail@example.com",
  "username": "newusername",
  "year_of_study": 3,
  "speciality": "Chirurgie"
}
```

**Response:** `200 OK` (Updated user object)

**cURL Example:**
```bash
curl -X PUT "http://localhost:8000/users/1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year_of_study": 3}'
```

---

#### 4.9. Delete User Account
**Endpoint:** `DELETE /users/{user_id}`

**Description:** Delete a user account. Users can only delete their own account unless they're admin.

**Path Parameters:**
- `user_id` (integer): The ID of the user

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
{
  "message": "User deleted successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE "http://localhost:8000/users/1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 5. Admin Endpoints (Admin Only)

#### 5.1. Get Dashboard Statistics
**Endpoint:** `GET /admin/dashboard`

**Description:** Get comprehensive dashboard statistics (admin only).

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
{
  "user_stats": {
    "total_users": 150,
    "paid_users": 100,
    "unpaid_users": 50,
    "owner_users": 1,
    "admin_users": 3,
    "manager_users": 5,
    "student_users": 141
  },
  "question_stats": {
    "total_questions": 500,
    "total_answers": 2500,
    "average_answers_per_question": 5.0
  },
  "activation_key_stats": {
    "total_keys": 200,
    "used_keys": 100,
    "unused_keys": 100
  },
  "course_stats": [
    {"course": "Anatomie", "count": 150},
    {"course": "Biochimie", "count": 100}
  ],
  "speciality_stats": [
    {"speciality": "Médecine", "count": 450}
  ],
  "year_stats": [
    {"year": 2024, "count": 300},
    {"year": 2023, "count": 200}
  ]
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/admin/dashboard" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 5.2. Get All Users (Admin)
**Endpoint:** `GET /admin/users`

**Description:** Get all users with filtering options (admin or manager only).

**Query Parameters:**
- `skip` (integer, optional): Number of records to skip (default: 0)
- `limit` (integer, optional): Maximum records (default: 100, max: 1000)
- `user_type` (string, optional): Filter by user type (owner, admin, manager, student)
- `is_paid` (boolean, optional): Filter by payment status

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK` (Array of user objects)

**cURL Example:**
```bash
# Get all paid students
curl -X GET "http://localhost:8000/admin/users?user_type=student&is_paid=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 5.3. Update User Payment Status
**Endpoint:** `PUT /admin/users/{user_id}/payment`

**Description:** Update user payment status (manager or admin only).

**Path Parameters:**
- `user_id` (integer): The ID of the user

**Query Parameters:**
- `is_paid` (boolean): New payment status

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
{
  "message": "User payment status updated successfully",
  "user_id": 1,
  "is_paid": true
}
```

**cURL Example:**
```bash
curl -X PUT "http://localhost:8000/admin/users/1/payment?is_paid=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 5.4. Update User Role
**Endpoint:** `PUT /admin/users/{user_id}/role`

**Description:** Update user role/type (admin only).

**Path Parameters:**
- `user_id` (integer): The ID of the user

**Query Parameters:**
- `user_type` (string): New user type (owner, admin, manager, student)

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
{
  "message": "User role updated successfully",
  "user_id": 1,
  "user_type": "manager"
}
```

**cURL Example:**
```bash
curl -X PUT "http://localhost:8000/admin/users/1/role?user_type=manager" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 5.5. Get User Detailed Information
**Endpoint:** `GET /admin/users/{user_id}/details`

**Description:** Get detailed user information (manager or admin only).

**Path Parameters:**
- `user_id` (integer): The ID of the user

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "student@example.com",
  "username": "student123",
  "user_type": "student",
  "is_paid": true,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-02T10:00:00Z"
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/admin/users/1/details" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 5.6. Delete User (Admin)
**Endpoint:** `DELETE /admin/users/{user_id}`

**Description:** Delete a user (admin only).

**Path Parameters:**
- `user_id` (integer): The ID of the user

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
{
  "message": "User deleted successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE "http://localhost:8000/admin/users/1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 5.7. Create Activation Key
**Endpoint:** `POST /admin/activation-keys`

**Description:** Generate a new activation key (admin only).

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "key": "ACTKEY-12345-ABCDE-67890",
  "user_id": null,
  "is_used": false,
  "created_by": 1,
  "created_at": "2024-01-01T12:00:00Z",
  "used_at": null,
  "expires_at": null
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/admin/activation-keys" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 5.8. Get Activation Keys
**Endpoint:** `GET /admin/activation-keys`

**Description:** Get all activation keys (admin only).

**Query Parameters:**
- `skip` (integer, optional): Number of records to skip (default: 0)
- `limit` (integer, optional): Maximum records (default: 100, max: 1000)
- `is_used` (boolean, optional): Filter by usage status

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK` (Array of activation key objects)

**cURL Example:**
```bash
# Get only unused keys
curl -X GET "http://localhost:8000/admin/activation-keys?is_used=false" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### 5.9. Get Activation Key Statistics
**Endpoint:** `GET /admin/activation-keys/stats`

**Description:** Get activation key statistics (admin only).

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
{
  "total_keys": 200,
  "used_keys": 100,
  "unused_keys": 100
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/admin/activation-keys/stats" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| email | String | Unique email address |
| username | String | Unique username |
| hashed_password | String | Bcrypt hashed password |
| user_type | Enum | User role (owner, admin, manager, student) |
| is_paid | Boolean | Payment status (default: false) |
| year_of_study | Integer | Study year for students (1-3) |
| speciality | String | Medical speciality |
| created_at | DateTime | Account creation timestamp |
| updated_at | DateTime | Last update timestamp |

### Questions Table
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| year | Integer | Exam year (e.g., 2024) |
| study_year | Integer | Academic year (1, 2, or 3) |
| module | String | Module name |
| unite | String | Unit name (for 2nd/3rd year) |
| speciality | String | Medical speciality |
| cours | JSON | Array of course names |
| exam_type | String | Exam type (EMD, EMD1, EMD2, Rattrapage) |
| number | Integer | Question number |
| question_text | Text | Question text |
| question_image | String | Path to question image (optional) |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### Answers Table
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| question_id | Integer | Foreign key to questions table |
| answer_text | Text | Answer text |
| answer_image | String | Path to answer image (optional) |
| is_correct | Boolean | Whether this is a correct answer |
| option_label | String | Option label (a, b, c, d, e) |
| created_at | DateTime | Creation timestamp |

### ActivationKeys Table
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| key | String | Unique activation key |
| user_id | Integer | Foreign key to users (null if unused) |
| is_used | Boolean | Usage status (default: false) |
| created_by | Integer | Foreign key to user who created it |
| created_at | DateTime | Creation timestamp |
| used_at | DateTime | When the key was used |
| expires_at | DateTime | Expiration timestamp (1 year after activation) |

### DeviceSessions Table
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| user_id | Integer | Foreign key to users table |
| device_fingerprint | String | Unique device identifier |
| device_name | String | User-friendly device name |
| is_active | Boolean | Whether device is active |
| created_at | DateTime | Registration timestamp |
| last_seen | DateTime | Last activity timestamp |

---

## User Roles and Permissions

### Owner
- **Highest level of access**
- Can perform all operations
- Can create other admins
- Cannot be edited or deleted by anyone else
- Only one owner per system

### Admin
- Full access to all features
- Can manage users (except owner)
- Can create and manage questions
- Can generate activation keys
- Access to dashboard statistics
- Can promote users to manager

### Manager
- Can create and manage questions
- Can view all users
- Can manage user payment status
- Limited user management capabilities
- Cannot change user roles

### Student
- Default role for new users
- Can access questions only when `is_paid = true`
- Can view their own profile
- Can register up to 2 devices
- Can use activation keys

---

## Usage Examples

### Complete Workflow Example

#### 1. Register a New Student
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "marie.dupont@example.com",
    "username": "mariedupont",
    "password": "SecurePass123!",
    "year_of_study": 2,
    "speciality": "Médecine"
  }'
```

#### 2. Login and Get Token
```bash
curl -X POST "http://localhost:8000/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=marie.dupont@example.com&password=SecurePass123!"
```

Save the access token from the response.

#### 3. Activate Account (Requires Activation Key from Admin)
```bash
curl -X POST "http://localhost:8000/users/activate" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key": "ACTKEY-12345-ABCDE-67890"}'
```

#### 4. Access Questions for 2nd Year
```bash
curl -X GET "http://localhost:8000/questions/?study_year=2&module=Anatomie&exam_type=EMD" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 5. Register Your Device
```bash
curl -X POST "http://localhost:8000/users/devices" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_fingerprint": "unique-device-hash-123",
    "device_name": "iPhone 13"
  }'
```

---

### Admin Workflow Example

#### 1. Login as Admin
```bash
curl -X POST "http://localhost:8000/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@example.com&password=AdminPass123!"
```

#### 2. Generate Activation Keys
```bash
# Generate 5 activation keys
for i in {1..5}; do
  curl -X POST "http://localhost:8000/admin/activation-keys" \
    -H "Authorization: Bearer ADMIN_TOKEN"
done
```

#### 3. View Dashboard Statistics
```bash
curl -X GET "http://localhost:8000/admin/dashboard" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### 4. Import Questions from JSON
```bash
curl -X POST "http://localhost:8000/questions/import" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "file=@my-questions.json"
```

#### 5. Update User Payment Status
```bash
curl -X PUT "http://localhost:8000/admin/users/5/payment?is_paid=true" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Scripts and Utilities

The `backend/scripts/` directory contains utility scripts for database management:

### Available Scripts

#### 1. `create_owner.py`
Creates the initial owner user account.

**Usage:**
```bash
cd backend
python scripts/create_owner.py
```

#### 2. `reset_french_structure.py`
Resets the database with the French medical education structure.

**Usage:**
```bash
cd backend
python scripts/reset_french_structure.py
```

#### 3. `reset_database.py`
Resets the entire database (deletes all data).

**Usage:**
```bash
cd backend
python scripts/reset_database.py
```

#### 4. `seed_data.py`
Seeds the database with sample data for testing.

**Usage:**
```bash
cd backend
python scripts/seed_data.py
```

#### 5. `import_questions.py`
Imports questions from a JSON file.

**Usage:**
```bash
cd backend
python scripts/import_questions.py path/to/questions.json
```

#### 6. `complete_reset.py`
Performs a complete database reset and sets up initial structure.

**Usage:**
```bash
cd backend
python scripts/complete_reset.py
```

---

## Database Migrations

The application uses Alembic for database migrations.

### Common Migration Commands

#### Create a New Migration
```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
```

#### Apply Migrations
```bash
cd backend
alembic upgrade head
```

#### Rollback Migration
```bash
cd backend
alembic downgrade -1
```

#### View Migration History
```bash
cd backend
alembic history
```

---

## Error Handling

The API uses standard HTTP status codes:

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

**Error Response Format:**
```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## Security Considerations

### Best Practices

1. **Change Default Settings:**
   - Generate a strong, random `SECRET_KEY` for JWT signing
   - Use PostgreSQL in production instead of SQLite
   - Set `ACCESS_TOKEN_EXPIRE_MINUTES` appropriately

2. **Use HTTPS in Production:**
   - Always use HTTPS to encrypt data in transit
   - Configure proper SSL/TLS certificates

3. **Secure Password Policy:**
   - Enforce strong password requirements
   - Passwords are hashed using bcrypt

4. **Limit Device Access:**
   - Users are limited to 2 devices maximum
   - Device sessions can be deactivated

5. **Regular Backups:**
   - Backup the database regularly
   - Test restore procedures

6. **Update Dependencies:**
   - Keep all dependencies up to date
   - Monitor for security vulnerabilities

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: Could not connect to database
```
**Solution:** Check your `DATABASE_URL` in the `.env` file and ensure the database server is running.

#### 2. Authentication Failed
```
401 Unauthorized: Incorrect username or password
```
**Solution:** Verify your email/username and password are correct. Remember that the username field accepts email addresses.

#### 3. Permission Denied
```
403 Forbidden: Not enough permissions
```
**Solution:** Ensure your user account has the appropriate role (manager/admin) for the operation.

#### 4. Activation Key Invalid
```
400 Bad Request: Invalid or already used activation key
```
**Solution:** Verify the activation key is correct and hasn't been used already.

#### 5. Import Failed
```
400 Bad Request: Invalid JSON file
```
**Solution:** Ensure your JSON file is properly formatted and contains all required fields.

---

## Development and Testing

### Running Tests
```bash
cd backend
pytest
```

### Development Mode with Auto-Reload
```bash
cd backend
python run.py
```
This starts the server with auto-reload enabled, which automatically restarts when code changes are detected.

### Accessing API Documentation
- **Swagger UI:** http://localhost:8000/docs (Interactive API testing)
- **ReDoc:** http://localhost:8000/redoc (Alternative documentation view)

---

## Support and Contact

For issues, questions, or contributions:
- Create an issue on the GitHub repository
- Contact the development team

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## Appendix: Quick Reference

### Environment Variables
```env
DATABASE_URL=sqlite:///./mcq_study.db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### User Types
- `owner` - System owner
- `admin` - Administrator
- `manager` - Question manager
- `student` - Regular student

### Exam Types
- `EMD` - General exam
- `EMD1` - First semester exam
- `EMD2` - Second semester exam
- `RATTRAPAGE` - Retake exam

### Study Years
- `1` - 1ère Année (1st Year)
- `2` - 2ème Année (2nd Year)
- `3` - 3ème Année (3rd Year)

---

**Last Updated:** 2024
**Version:** 1.0.0
