# MCQ Study App Backend

A FastAPI backend for a MCQ (Multiple Choice Questions) study application with authentication and question management features.

## Features

- **Authentication**: User registration, login, and JWT token-based authentication
- **Role-Based Access Control**: Admin, Manager, and Student user types
- **Question Management**: CRUD operations for MCQ questions with answers (Manager/Admin only)
- **Access Control**: Only paid users can access questions
- **Admin Dashboard**: Comprehensive statistics and user management
- **User Management**: Payment status and role management by Admin/Manager
- **Filtering**: Questions can be filtered by year and course

## Database Schema

### Users
- `id`: Primary key
- `email`: Unique email address
- `username`: Unique username
- `hashed_password`: Encrypted password
- `user_type`: Enum (admin, manager, student)
- `is_paid`: Boolean indicating payment status
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### Questions
- `id`: Primary key
- `year`: Year of the exam
- `course`: Course name
- `number`: Question number
- `question_text`: The actual question
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Answers
- `id`: Primary key
- `question_id`: Foreign key to questions
- `answer_text`: The answer option
- `is_correct`: Boolean indicating if it's correct
- `created_at`: Creation timestamp

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file in the backend directory with the following variables:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/mcq_study_db
SECRET_KEY=your-secret-key-here-make-it-long-and-random
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

For development, you can use SQLite:
```env
DATABASE_URL=sqlite:///./mcq_study.db
```

### 3. Run the Application

```bash
python run.py
```

Or using uvicorn directly:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- **Interactive API docs**: `http://localhost:8000/docs`
- **ReDoc documentation**: `http://localhost:8000/redoc`

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/token` - Login and get access token
- `GET /auth/me` - Get current user profile

### Questions (Paid Users Only)
- `GET /questions/` - Get all questions (with filtering options)
- `GET /questions/{question_id}` - Get specific question
- `GET /questions/courses/list` - Get available courses
- `GET /questions/years/list` - Get available years

### Question Management (Manager/Admin Only)
- `POST /questions/` - Create new question
- `PUT /questions/{question_id}` - Update question
- `DELETE /questions/{question_id}` - Delete question

### Users
- `GET /users/` - Get all users (manager/admin)
- `GET /users/{user_id}` - Get specific user
- `PUT /users/{user_id}` - Update user profile
- `DELETE /users/{user_id}` - Delete user account

### Admin Dashboard
- `GET /admin/dashboard` - Get dashboard statistics (admin only)
- `GET /admin/users` - Get all users with filtering (manager/admin)
- `PUT /admin/users/{user_id}/payment` - Update user payment status (manager/admin)
- `PUT /admin/users/{user_id}/role` - Update user role (admin only)
- `GET /admin/users/{user_id}/details` - Get detailed user info (manager/admin)
- `DELETE /admin/users/{user_id}` - Delete user (admin only)

## Usage Examples

### 1. Register a User
```bash
curl -X POST "http://localhost:8000/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "student@example.com",
       "username": "student1",
       "password": "password123"
     }'
```

### 2. Login
```bash
curl -X POST "http://localhost:8000/auth/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=student1&password=password123"
```

### 3. Get Questions (with token)
```bash
curl -X GET "http://localhost:8000/questions/" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Create a Question
```bash
curl -X POST "http://localhost:8000/questions/" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "year": 2023,
       "course": "Mathematics",
       "number": 1,
       "question_text": "What is 2 + 2?",
       "answers": [
         {"answer_text": "3", "is_correct": false},
         {"answer_text": "4", "is_correct": true},
         {"answer_text": "5", "is_correct": false},
         {"answer_text": "6", "is_correct": false}
       ]
     }'
```

## Security Features

- Password hashing using bcrypt
- JWT token-based authentication
- CORS middleware for cross-origin requests
- Input validation using Pydantic schemas
- Access control based on user payment status

## Development Notes

- The application uses SQLAlchemy for database operations
- Alembic is included for database migrations (not configured yet)
- The current implementation allows any authenticated user to create/edit questions
- In production, you should implement proper role-based access control
- Consider adding rate limiting and additional security measures

## Future Enhancements

- Database migrations with Alembic
- Role-based access control (admin, teacher, student)
- Question categories and tags
- User progress tracking
- Quiz sessions and scoring
- Payment integration
- File upload for question images
- Search functionality
- Analytics and reporting 