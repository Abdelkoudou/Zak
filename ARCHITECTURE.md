# MCQ Study App - System Architecture

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Backend Architecture](#backend-architecture)
- [Mobile App Architecture](#mobile-app-architecture)
- [Database Schema](#database-schema)
- [API Design](#api-design)
- [Security Architecture](#security-architecture)
- [Deployment Architecture](#deployment-architecture)

---

## Overview

The MCQ Study App is a mobile-first medical exam preparation platform designed for French medical education (Algerian market). The system consists of:

- **Backend API**: FastAPI-based REST API
- **Mobile App**: React Native (Expo) cross-platform application
- **Database**: PostgreSQL (production) / SQLite (development)

### Key Design Principles
1. **Mobile-First**: Optimized for mobile devices (iOS & Android)
2. **Offline-Capable**: Questions cached locally for offline access
3. **Secure**: JWT authentication, role-based access control
4. **Scalable**: Designed to handle thousands of users and questions
5. **Simple**: Focus on core MCQ features, avoid over-engineering

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   iOS App        │         │   Android App    │          │
│  │  (React Native)  │         │  (React Native)  │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                            │                     │
│           └────────────┬───────────────┘                     │
│                        │                                     │
└────────────────────────┼─────────────────────────────────────┘
                         │
                         │ HTTPS/REST API
                         │
┌────────────────────────┼─────────────────────────────────────┐
│                        │      API LAYER                       │
├────────────────────────┼─────────────────────────────────────┤
│                        ▼                                      │
│              ┌──────────────────┐                            │
│              │   FastAPI App    │                            │
│              │   (Python 3.8+)  │                            │
│              └────────┬─────────┘                            │
│                       │                                       │
│         ┌─────────────┼─────────────┐                        │
│         │             │             │                        │
│    ┌────▼────┐   ┌───▼────┐   ┌───▼────┐                   │
│    │  Auth   │   │ MCQ    │   │ Admin  │                   │
│    │ Router  │   │ Router │   │ Router │                   │
│    └────┬────┘   └───┬────┘   └───┬────┘                   │
│         │            │            │                         │
│         └────────────┼────────────┘                         │
│                      │                                       │
└──────────────────────┼───────────────────────────────────────┘
                       │
                       │ SQLAlchemy ORM
                       │
┌──────────────────────┼───────────────────────────────────────┐
│                      │      DATA LAYER                        │
├──────────────────────┼───────────────────────────────────────┤
│                      ▼                                        │
│            ┌──────────────────┐                              │
│            │   PostgreSQL     │                              │
│            │   Database       │                              │
│            └──────────────────┘                              │
│                                                               │
│  Tables: users, questions, answers, activation_keys,         │
│          device_sessions, saved_questions, test_attempts,    │
│          course_resources                                    │
└───────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend
```yaml
Framework: FastAPI 0.104+
Language: Python 3.8+
ORM: SQLAlchemy 2.0+
Database: PostgreSQL 14+ (production), SQLite (development)
Authentication: JWT (python-jose)
Password Hashing: bcrypt (passlib)
Validation: Pydantic 2.5+
Migrations: Alembic 1.12+
Server: Uvicorn (ASGI)
```

### Mobile App
```yaml
Framework: React Native (Expo SDK 50)
Language: TypeScript 5.1+
Navigation: React Navigation 6
State Management: React Context API
Local Storage: AsyncStorage
HTTP Client: Axios
Forms: React Hook Form
Styling: React Native StyleSheet + NativeWind
Icons: Expo Vector Icons
```

### DevOps
```yaml
Version Control: Git
Hosting: DigitalOcean / Railway / Heroku
CI/CD: GitHub Actions (optional)
Monitoring: Sentry (optional)
Analytics: Mixpanel / Firebase Analytics (optional)
```

---

## Backend Architecture

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Routers - HTTP Request Handlers)      │
├─────────────────────────────────────────┤
│         Business Logic Layer            │
│  (CRUD Operations - app/crud.py)        │
├─────────────────────────────────────────┤
│         Data Access Layer               │
│  (SQLAlchemy Models - app/models.py)    │
├─────────────────────────────────────────┤
│         Database Layer                  │
│  (PostgreSQL / SQLite)                  │
└─────────────────────────────────────────┘
```

### Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app initialization
│   ├── database.py          # Database connection
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── crud.py              # CRUD operations
│   ├── auth.py              # Authentication logic
│   ├── permissions.py       # Authorization logic
│   ├── constants.py         # Medical structure constants
│   └── routers/
│       ├── __init__.py
│       ├── auth.py          # Auth endpoints
│       ├── users.py         # User management
│       ├── questions.py     # MCQ endpoints
│       └── admin.py         # Admin endpoints
├── scripts/
│   ├── create_owner.py      # Create owner user
│   ├── seed_data.py         # Seed test data
│   └── import_questions.py  # Import questions from JSON
├── alembic/                 # Database migrations
├── .env                     # Environment variables
├── requirements.txt         # Python dependencies
└── run.py                   # Development server
```

### Key Components

#### 1. Authentication Flow
```python
User Login → Validate Credentials → Generate JWT Token → Return Token
User Request → Validate JWT → Extract User → Check Permissions → Process Request
```

#### 2. Authorization Levels
```
Owner > Admin > Manager > Student
```

#### 3. Request Flow
```
Client Request
    ↓
FastAPI Router
    ↓
Permission Check (Depends)
    ↓
CRUD Operation
    ↓
Database Query (SQLAlchemy)
    ↓
Response (Pydantic Schema)
```

---

## Mobile App Architecture

### Component Architecture

```
┌─────────────────────────────────────────┐
│         App.tsx (Root)                  │
│         - AuthProvider                  │
│         - AppNavigator                  │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼────┐  ┌───▼────┐  ┌───▼────┐
│ Auth   │  │ Main   │  │ Admin  │
│ Stack  │  │ Stack  │  │ Stack  │
└───┬────┘  └───┬────┘  └───┬────┘
    │           │            │
┌───▼────┐  ┌───▼────┐  ┌───▼────┐
│ Login  │  │ Home   │  │ Stats  │
│ Signup │  │ Practice│  │ Users  │
└────────┘  │ Review │  └────────┘
            │ Profile│
            └────────┘
```

### Directory Structure

```
react-native-med-app/
├── src/
│   ├── components/
│   │   └── ui/              # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Badge.tsx
│   │       ├── Alert.tsx
│   │       └── Progress.tsx
│   ├── screens/             # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── PracticeScreen.tsx
│   │   ├── ReviewScreen.tsx
│   │   └── AnalyticsScreen.tsx
│   ├── navigation/          # Navigation config
│   │   └── AppNavigator.tsx
│   ├── context/             # React contexts
│   │   └── AuthProvider.tsx
│   ├── services/            # API services
│   │   ├── api.ts           # API client
│   │   ├── auth.ts          # Auth service
│   │   └── questions.ts     # Questions service
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   └── utils/               # Utility functions
│       └── storage.ts       # AsyncStorage helpers
├── assets/                  # Images, fonts
├── App.tsx                  # Root component
├── app.json                 # Expo config
└── package.json             # Dependencies
```

### State Management Strategy

```
┌─────────────────────────────────────────┐
│         Global State (Context)          │
│  - AuthContext (user, login, logout)    │
│  - ThemeContext (optional)              │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼────┐  ┌───▼────┐  ┌───▼────┐
│ Local  │  │ Local  │  │ Local  │
│ State  │  │ State  │  │ State  │
│(Screen)│  │(Screen)│  │(Screen)│
└────────┘  └────────┘  └────────┘
```

### Data Flow

```
User Action
    ↓
Screen Component
    ↓
API Service Call
    ↓
Backend API
    ↓
Response
    ↓
Update Local State
    ↓
Re-render UI
```

---

## Database Schema

### Core Tables

#### 1. Users Table
```sql
users
├── id (PK)
├── email (UNIQUE)
├── username (UNIQUE)
├── hashed_password
├── user_type (ENUM: owner, admin, manager, student)
├── is_paid (BOOLEAN)
├── year_of_study (INTEGER)
├── speciality (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### 2. Questions Table
```sql
questions
├── id (PK)
├── year (INTEGER) - Exam year (2024)
├── study_year (INTEGER) - 1st/2nd/3rd year
├── module (VARCHAR) - Module name
├── unite (VARCHAR, NULLABLE) - Unit name
├── speciality (VARCHAR)
├── cours (JSON) - Array of course names
├── exam_type (VARCHAR) - EMD, EMD1, EMD2, Rattrapage
├── number (INTEGER) - Question number
├── question_text (TEXT)
├── question_image (VARCHAR, NULLABLE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### 3. Answers Table
```sql
answers
├── id (PK)
├── question_id (FK → questions.id)
├── answer_text (TEXT)
├── answer_image (VARCHAR, NULLABLE)
├── is_correct (BOOLEAN)
├── option_label (VARCHAR) - a, b, c, d, e
└── created_at (TIMESTAMP)
```

#### 4. Activation Keys Table
```sql
activation_keys
├── id (PK)
├── key (VARCHAR, UNIQUE)
├── user_id (FK → users.id, NULLABLE)
├── is_used (BOOLEAN)
├── created_by (FK → users.id)
├── created_at (TIMESTAMP)
├── used_at (TIMESTAMP, NULLABLE)
└── expires_at (TIMESTAMP, NULLABLE)
```

#### 5. Device Sessions Table
```sql
device_sessions
├── id (PK)
├── user_id (FK → users.id)
├── device_fingerprint (VARCHAR)
├── device_name (VARCHAR, NULLABLE)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
└── last_seen (TIMESTAMP)
```

### New Tables (To Be Added)

#### 6. Saved Questions Table
```sql
saved_questions
├── id (PK)
├── user_id (FK → users.id)
├── question_id (FK → questions.id)
├── created_at (TIMESTAMP)
└── UNIQUE(user_id, question_id)
```

#### 7. Test Attempts Table
```sql
test_attempts
├── id (PK)
├── user_id (FK → users.id)
├── module (VARCHAR)
├── study_year (INTEGER)
├── questions_attempted (INTEGER)
├── correct_count (INTEGER)
├── score_percentage (FLOAT)
├── time_spent (INTEGER) - seconds
├── created_at (TIMESTAMP)
└── completed_at (TIMESTAMP)
```

#### 8. Course Resources Table
```sql
course_resources
├── id (PK)
├── title (VARCHAR)
├── url (TEXT) - Google Drive link
├── category (VARCHAR) - drive, telegram, pdf, video
├── year (INTEGER, NULLABLE)
├── study_year (INTEGER, NULLABLE)
├── module (VARCHAR, NULLABLE)
├── created_by (FK → users.id)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Relationships

```
users (1) ──→ (N) activation_keys
users (1) ──→ (N) device_sessions
users (1) ──→ (N) saved_questions
users (1) ──→ (N) test_attempts
users (1) ──→ (N) course_resources

questions (1) ──→ (N) answers
questions (1) ──→ (N) saved_questions
```

---

## API Design

### RESTful Principles

```
Resource-based URLs
HTTP Methods: GET, POST, PUT, DELETE
Status Codes: 200, 201, 400, 401, 403, 404, 500
JSON Request/Response
JWT Authentication
```

### API Endpoints Structure

```
/auth/*           - Authentication endpoints
/users/*          - User management
/questions/*      - MCQ questions
/admin/*          - Admin operations
/resources/*      - Course resources (NEW)
```

### Authentication Flow

```
POST /auth/register
    → Create user account
    → Return user object

POST /auth/token
    → Validate credentials
    → Return JWT token

GET /auth/me
    → Validate JWT
    → Return current user
```

### Request/Response Format

**Request:**
```json
{
  "headers": {
    "Authorization": "Bearer <jwt_token>",
    "Content-Type": "application/json"
  },
  "body": {
    "field": "value"
  }
}
```

**Response (Success):**
```json
{
  "id": 1,
  "field": "value",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Response (Error):**
```json
{
  "detail": "Error message"
}
```

---

## Security Architecture

### Authentication
- **JWT Tokens**: Stateless authentication
- **Token Expiry**: 30 minutes (configurable)
- **Refresh Strategy**: Re-login required (simple approach)

### Authorization
- **Role-Based Access Control (RBAC)**
- **Permission Decorators**: `@require_admin`, `@require_paid_user`
- **Owner Protection**: Cannot be modified by others

### Password Security
- **Hashing**: bcrypt with salt
- **Minimum Length**: 8 characters (recommended)
- **No Plaintext Storage**: Ever

### API Security
- **HTTPS Only**: In production
- **CORS**: Configured for mobile app
- **Rate Limiting**: Device session limits (2 devices)
- **Input Validation**: Pydantic schemas

### Data Security
- **SQL Injection**: Prevented by SQLAlchemy ORM
- **XSS**: Not applicable (API only)
- **Sensitive Data**: Environment variables

---

## Deployment Architecture

### Development Environment
```
Local Machine
├── Backend: localhost:8000 (SQLite)
├── Mobile: Expo Go (development)
└── Database: SQLite file
```

### Production Environment
```
┌─────────────────────────────────────────┐
│         Mobile Apps                      │
│  iOS App Store + Google Play Store      │
└────────────────┬────────────────────────┘
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────┐
│         Load Balancer (Optional)        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Application Server              │
│  DigitalOcean Droplet / Railway         │
│  - FastAPI (Uvicorn)                    │
│  - Nginx (Reverse Proxy)                │
│  - SSL Certificate (Let's Encrypt)      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Database Server                 │
│  PostgreSQL 14+                         │
│  - Managed Database (Recommended)       │
│  - Daily Backups                        │
└─────────────────────────────────────────┘
```

### Deployment Options

#### Option 1: Railway (Easiest)
```
- Git-based deployment
- Automatic PostgreSQL
- SSL included
- $5-10/month
```

#### Option 2: DigitalOcean (Best Value)
```
- Manual setup required
- Full control
- Managed PostgreSQL available
- $6-12/month
```

#### Option 3: Heroku (Simple)
```
- Easy deployment
- Add-ons available
- More expensive
- $7+/month
```

---

## Performance Considerations

### Backend Optimization
- **Database Indexing**: On frequently queried fields
- **Pagination**: All list endpoints (skip/limit)
- **Connection Pooling**: SQLAlchemy default
- **Query Optimization**: Avoid N+1 queries

### Mobile App Optimization
- **Lazy Loading**: Load questions on demand
- **Image Optimization**: Compress images
- **Caching**: AsyncStorage for offline access
- **Pagination**: Infinite scroll for questions

### Scalability
- **Horizontal Scaling**: Add more app servers
- **Database Scaling**: Read replicas (future)
- **CDN**: For static assets (future)
- **Caching Layer**: Redis (future)

---

## Monitoring & Maintenance

### Logging
```python
- Application logs (INFO, ERROR)
- Access logs (requests)
- Error tracking (Sentry - optional)
```

### Backups
```
- Database: Daily automated backups
- Code: Git repository
- Environment: Document all configs
```

### Updates
```
- Backend: Rolling updates (zero downtime)
- Mobile: App store updates
- Database: Alembic migrations
```

---

## Future Architecture Enhancements

### Phase 2 (Post-Launch)
- Push notifications (Firebase Cloud Messaging)
- Real-time features (WebSockets)
- Advanced analytics (Mixpanel)
- Offline-first architecture (SQLite on mobile)

### Phase 3 (Scale)
- Microservices architecture
- Redis caching layer
- CDN for media files
- Load balancing
- Auto-scaling

---

## Conclusion

This architecture provides:
- ✅ **Simplicity**: Easy to understand and maintain
- ✅ **Security**: Industry-standard practices
- ✅ **Scalability**: Can grow with user base
- ✅ **Reliability**: Proven technologies
- ✅ **Cost-Effective**: Minimal infrastructure costs

The architecture is designed to get to market quickly while maintaining quality and allowing for future growth.
