# MCQ Study App - API Specification

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)

---

## Overview

This document provides detailed specifications for all API endpoints in the MCQ Study App.

### API Version
- **Version**: 1.0.0
- **Protocol**: REST
- **Format**: JSON
- **Authentication**: JWT Bearer Token

### General Conventions
- All timestamps are in ISO 8601 format (UTC)
- All IDs are integers
- Pagination uses `skip` and `limit` parameters
- Filtering uses query parameters

---

## Base URL

### Development
```
http://localhost:8000
```

### Production
```
https://api.mcqstudy.com
```

---

## Authentication

### JWT Token
All authenticated endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Token Expiry
- **Duration**: 30 minutes
- **Refresh**: Re-login required (no refresh token in MVP)

### Obtaining a Token
```http
POST /auth/token
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=password123
```

---

## Error Handling

### Error Response Format
```json
{
  "detail": "Error message description"
}
```

### HTTP Status Codes
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

### Common Error Examples

**401 Unauthorized**:
```json
{
  "detail": "Could not validate credentials"
}
```

**403 Forbidden**:
```json
{
  "detail": "Paid subscription required"
}
```

**404 Not Found**:
```json
{
  "detail": "Question not found"
}
```

**422 Validation Error**:
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

---

## Rate Limiting

### Device Limits
- **Max Devices**: 2 per user
- **Enforcement**: Automatic (oldest device deactivated)

### API Rate Limits (Future)
- **Requests**: 100 per minute per user
- **Login Attempts**: 5 per minute per IP

---

## Endpoints

## 1. Authentication Endpoints

### 1.1 Register User

**Endpoint**: `POST /auth/register`

**Description**: Create a new user account.

**Authentication**: None required

**Request Body**:
```json
{
  "email": "student@example.com",
  "username": "student123",
  "password": "securepass123",
  "year_of_study": 2,
  "speciality": "Médecine"
}
```

**Request Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| username | string | Yes | Unique username (3-50 chars) |
| password | string | Yes | Password (min 8 chars) |
| year_of_study | integer | No | 1, 2, or 3 |
| speciality | string | No | Médecine, Pharmacie, Dentaire |

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

**Errors**:
- `400`: Email already registered
- `400`: Username already taken
- `422`: Validation error

---

### 1.2 Login

**Endpoint**: `POST /auth/token`

**Description**: Authenticate and receive JWT token.

**Authentication**: None required

**Request Body** (form-urlencoded):
```
username=student@example.com
password=securepass123
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors**:
- `401`: Incorrect username or password

---

### 1.3 Get Current User

**Endpoint**: `GET /auth/me`

**Description**: Get authenticated user details.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "student@example.com",
  "username": "student123",
  "user_type": "student",
  "is_paid": true,
  "year_of_study": 2,
  "speciality": "Médecine",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```

---

## 2. User Management Endpoints

### 2.1 Activate Account

**Endpoint**: `POST /users/activate`

**Description**: Activate user account with activation key.

**Authentication**: Required

**Request Body**:
```json
{
  "key": "ABCD1234EFGH5678"
}
```

**Response** (200 OK):
```json
{
  "message": "Account activated successfully",
  "user_id": 1,
  "is_paid": true,
  "expires_at": "2025-01-01T10:00:00Z"
}
```

**Errors**:
- `400`: Invalid or already used activation key

---

### 2.2 Change Password

**Endpoint**: `POST /users/change-password`

**Description**: Change user password.

**Authentication**: None required (uses email + current password)

**Request Body**:
```json
{
  "email": "student@example.com",
  "current_password": "oldpass123",
  "new_password": "newpass456"
}
```

**Response** (200 OK):
```json
{
  "message": "Password changed successfully"
}
```

**Errors**:
- `400`: Invalid email or current password

---

### 2.3 Get User Devices

**Endpoint**: `GET /users/devices`

**Description**: Get all active device sessions for current user.

**Authentication**: Required

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "device_fingerprint": "abc123def456",
    "device_name": "iPhone 12",
    "is_active": true,
    "created_at": "2024-01-01T10:00:00Z",
    "last_seen": "2024-01-15T14:30:00Z"
  },
  {
    "id": 2,
    "user_id": 1,
    "device_fingerprint": "xyz789uvw012",
    "device_name": "iPad Pro",
    "is_active": true,
    "created_at": "2024-01-05T12:00:00Z",
    "last_seen": "2024-01-15T10:00:00Z"
  }
]
```

---

### 2.4 Register Device

**Endpoint**: `POST /users/devices`

**Description**: Register a new device (max 2 devices).

**Authentication**: Required

**Request Body**:
```json
{
  "device_fingerprint": "unique-device-id-123",
  "device_name": "Samsung Galaxy S21"
}
```

**Response** (201 Created):
```json
{
  "id": 3,
  "user_id": 1,
  "device_fingerprint": "unique-device-id-123",
  "device_name": "Samsung Galaxy S21",
  "is_active": true,
  "created_at": "2024-01-16T09:00:00Z",
  "last_seen": "2024-01-16T09:00:00Z"
}
```

**Note**: If user already has 2 devices, the oldest device will be automatically deactivated.

---

### 2.5 Deactivate Device

**Endpoint**: `DELETE /users/devices/{device_id}`

**Description**: Deactivate a device session.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| device_id | integer | Device session ID |

**Response** (200 OK):
```json
{
  "message": "Device deactivated successfully"
}
```

**Errors**:
- `404`: Device not found

---

## 3. Question Endpoints

### 3.1 Get Questions

**Endpoint**: `GET /questions/`

**Description**: Get questions with optional filtering.

**Authentication**: Required (paid user)

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| skip | integer | No | Pagination offset (default: 0) |
| limit | integer | No | Results per page (default: 20, max: 100) |
| year | integer | No | Exam year (e.g., 2024) |
| study_year | integer | No | Study year (1, 2, or 3) |
| module | string | No | Module name |
| unite | string | No | Unit name |
| speciality | string | No | Speciality |
| cours | string | No | Course name |
| exam_type | string | No | EMD, EMD1, EMD2, Rattrapage |

**Example Request**:
```
GET /questions/?study_year=2&module=Anatomie&limit=20
```

**Response** (200 OK):
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

**Errors**:
- `403`: Paid subscription required

---

### 3.2 Get Single Question

**Endpoint**: `GET /questions/{question_id}`

**Description**: Get a specific question by ID.

**Authentication**: Required (paid user)

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| question_id | integer | Question ID |

**Response** (200 OK):
Same format as single question in list response.

**Errors**:
- `403`: Paid subscription required
- `404`: Question not found

---

### 3.3 Get Medical Structure

**Endpoint**: `GET /questions/structure`

**Description**: Get complete French medical education structure.

**Authentication**: None required (public endpoint)

**Response** (200 OK):
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
      "Embryologie": ["EMD", "RATTRAPAGE"]
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

---

### 3.4 Get Available Modules

**Endpoint**: `GET /questions/modules/list`

**Description**: Get list of all modules in database.

**Authentication**: Required (paid user)

**Response** (200 OK):
```json
{
  "modules": ["Anatomie", "Biochimie", "Physiologie", "Histologie"]
}
```

---

### 3.5 Get Available Years

**Endpoint**: `GET /questions/years/list`

**Description**: Get list of exam years in database.

**Authentication**: Required (paid user)

**Response** (200 OK):
```json
{
  "years": [2024, 2023, 2022, 2021, 2020]
}
```

---

## 4. Saved Questions Endpoints (NEW)

### 4.1 Save Question

**Endpoint**: `POST /questions/{question_id}/save`

**Description**: Save a question for later review.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| question_id | integer | Question ID |

**Response** (201 Created):
```json
{
  "message": "Question saved successfully",
  "question_id": 1,
  "saved_at": "2024-01-16T10:00:00Z"
}
```

**Errors**:
- `400`: Question already saved
- `404`: Question not found

---

### 4.2 Unsave Question

**Endpoint**: `DELETE /questions/{question_id}/save`

**Description**: Remove question from saved list.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| question_id | integer | Question ID |

**Response** (200 OK):
```json
{
  "message": "Question removed from saved"
}
```

**Errors**:
- `404`: Question not in saved list

---

### 4.3 Get Saved Questions

**Endpoint**: `GET /questions/saved`

**Description**: Get all saved questions for current user.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| skip | integer | No | Pagination offset (default: 0) |
| limit | integer | No | Results per page (default: 20) |

**Response** (200 OK):
Same format as GET /questions/ response.

---

## 5. Test Results Endpoints (NEW)

### 5.1 Submit Test Results

**Endpoint**: `POST /tests/submit`

**Description**: Submit test results after practice session.

**Authentication**: Required

**Request Body**:
```json
{
  "module": "Anatomie",
  "study_year": 2,
  "questions_attempted": 20,
  "correct_count": 15,
  "time_spent": 600
}
```

**Request Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| module | string | Yes | Module name |
| study_year | integer | Yes | 1, 2, or 3 |
| questions_attempted | integer | Yes | Total questions |
| correct_count | integer | Yes | Correct answers |
| time_spent | integer | Yes | Time in seconds |

**Response** (201 Created):
```json
{
  "id": 1,
  "user_id": 1,
  "module": "Anatomie",
  "study_year": 2,
  "questions_attempted": 20,
  "correct_count": 15,
  "score_percentage": 75.0,
  "time_spent": 600,
  "created_at": "2024-01-16T10:00:00Z"
}
```

---

### 5.2 Get Test History

**Endpoint**: `GET /tests/history`

**Description**: Get user's test history.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| skip | integer | No | Pagination offset (default: 0) |
| limit | integer | No | Results per page (default: 20) |

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "module": "Anatomie",
    "study_year": 2,
    "questions_attempted": 20,
    "correct_count": 15,
    "score_percentage": 75.0,
    "time_spent": 600,
    "created_at": "2024-01-16T10:00:00Z"
  }
]
```

---

### 5.3 Get User Statistics

**Endpoint**: `GET /tests/stats`

**Description**: Get user's overall statistics.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "total_tests": 10,
  "total_questions_attempted": 200,
  "total_correct": 150,
  "overall_accuracy": 75.0,
  "average_score": 75.0,
  "best_score": 90.0,
  "total_time_spent": 6000,
  "recent_tests": [
    {
      "date": "2024-01-16",
      "tests_count": 2,
      "average_score": 80.0
    }
  ]
}
```

---

## 6. Course Resources Endpoints (NEW)

### 6.1 Get Resources

**Endpoint**: `GET /resources/`

**Description**: Get course resources (Google Drive links, etc.).

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| skip | integer | No | Pagination offset (default: 0) |
| limit | integer | No | Results per page (default: 20) |
| category | string | No | drive, telegram, pdf, video |
| year | integer | No | Exam year |
| study_year | integer | No | Study year (1, 2, 3) |
| module | string | No | Module name |

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "title": "Anatomie - Past Exams 2020-2024",
    "url": "https://drive.google.com/...",
    "category": "drive",
    "year": null,
    "study_year": 2,
    "module": "Anatomie",
    "created_at": "2024-01-01T10:00:00Z"
  },
  {
    "id": 2,
    "title": "Medical Students Telegram Channel",
    "url": "https://t.me/medstudents",
    "category": "telegram",
    "year": null,
    "study_year": null,
    "module": null,
    "created_at": "2024-01-01T10:00:00Z"
  }
]
```

---

### 6.2 Create Resource (Admin/Manager)

**Endpoint**: `POST /resources/`

**Description**: Add a new course resource.

**Authentication**: Required (Manager/Admin)

**Request Body**:
```json
{
  "title": "Anatomie - Past Exams 2020-2024",
  "url": "https://drive.google.com/...",
  "category": "drive",
  "year": null,
  "study_year": 2,
  "module": "Anatomie"
}
```

**Response** (201 Created):
Same format as single resource in list response.

---

### 6.3 Update Resource (Admin/Manager)

**Endpoint**: `PUT /resources/{resource_id}`

**Description**: Update a resource.

**Authentication**: Required (Manager/Admin)

**Request Body**:
```json
{
  "title": "Updated Title",
  "url": "https://drive.google.com/new-link"
}
```

**Response** (200 OK):
Updated resource object.

---

### 6.4 Delete Resource (Admin/Manager)

**Endpoint**: `DELETE /resources/{resource_id}`

**Description**: Delete a resource.

**Authentication**: Required (Manager/Admin)

**Response** (200 OK):
```json
{
  "message": "Resource deleted successfully"
}
```

---

## 7. Admin Endpoints

### 7.1 Get Dashboard Stats

**Endpoint**: `GET /admin/dashboard`

**Description**: Get system statistics.

**Authentication**: Required (Admin/Owner)

**Response** (200 OK):
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
    "average_answers_per_question": 4.0
  },
  "activation_key_stats": {
    "total_keys": 200,
    "used_keys": 120,
    "unused_keys": 80
  }
}
```

---

### 7.2 Generate Activation Key

**Endpoint**: `POST /admin/activation-keys`

**Description**: Generate a new activation key.

**Authentication**: Required (Admin/Owner)

**Response** (201 Created):
```json
{
  "id": 1,
  "key": "ABCD1234EFGH5678",
  "user_id": null,
  "is_used": false,
  "created_by": 1,
  "created_at": "2024-01-16T10:00:00Z",
  "used_at": null,
  "expires_at": null
}
```

---

### 7.3 List Activation Keys

**Endpoint**: `GET /admin/activation-keys`

**Description**: Get all activation keys.

**Authentication**: Required (Admin/Owner)

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| skip | integer | No | Pagination offset (default: 0) |
| limit | integer | No | Results per page (default: 100) |
| is_used | boolean | No | Filter by usage status |

**Response** (200 OK):
Array of activation key objects.

---

## 8. Question Management (Admin/Manager)

### 8.1 Create Question

**Endpoint**: `POST /questions/`

**Description**: Create a new question.

**Authentication**: Required (Manager/Admin)

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
  "question_text": "Question text here?",
  "question_image": null,
  "answers": [
    {
      "answer_text": "Answer A",
      "answer_image": null,
      "is_correct": true,
      "option_label": "a"
    },
    {
      "answer_text": "Answer B",
      "answer_image": null,
      "is_correct": false,
      "option_label": "b"
    }
  ]
}
```

**Response** (201 Created):
Created question object.

---

### 8.2 Import Questions

**Endpoint**: `POST /questions/import`

**Description**: Import questions from JSON file.

**Authentication**: Required (Manager/Admin)

**Request**: Multipart form with JSON file

**Response** (200 OK):
```json
{
  "message": "Import completed",
  "imported": 10,
  "skipped": 2,
  "errors": []
}
```

---

### 8.3 Update Question

**Endpoint**: `PUT /questions/{question_id}`

**Description**: Update a question.

**Authentication**: Required (Manager/Admin)

**Request Body**: Same as create (all fields optional)

**Response** (200 OK):
Updated question object.

---

### 8.4 Delete Question

**Endpoint**: `DELETE /questions/{question_id}`

**Description**: Delete a question.

**Authentication**: Required (Manager/Admin)

**Response** (200 OK):
```json
{
  "message": "Question deleted successfully"
}
```

---

## Appendix

### Data Types

**User Object**:
```typescript
{
  id: number;
  email: string;
  username: string;
  user_type: "owner" | "admin" | "manager" | "student";
  is_paid: boolean;
  year_of_study: number | null;
  speciality: string | null;
  created_at: string; // ISO 8601
  updated_at: string | null; // ISO 8601
}
```

**Question Object**:
```typescript
{
  id: number;
  year: number;
  study_year: number;
  module: string;
  unite: string | null;
  speciality: string;
  cours: string[];
  exam_type: string;
  number: number;
  question_text: string;
  question_image: string | null;
  created_at: string;
  updated_at: string | null;
  answers: Answer[];
  correct_answers: Answer[];
}
```

**Answer Object**:
```typescript
{
  id: number;
  question_id: number;
  answer_text: string;
  answer_image: string | null;
  is_correct: boolean;
  option_label: string;
  created_at: string;
}
```

---

## Changelog

### Version 1.0.0 (2024-01-16)
- Initial API specification
- Added saved questions endpoints
- Added test results endpoints
- Added course resources endpoints
