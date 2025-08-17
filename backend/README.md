# MCQ Study App Backend

A FastAPI backend for a MCQ (Multiple Choice Questions) study application with authentication and question management features.

## Features

- **Authentication**: User registration, login, and JWT token-based authentication
- **Role-Based Access Control**: Owner, Admin, Manager, and Student user types
- **Enhanced Student Profiles**: Year of study and academic speciality tracking
- **Question Management**: CRUD operations for MCQ questions with enhanced categorization (Manager/Admin only)
- **Answer System**: Support for 5 labeled answers (a-e) with multiple correct answers
- **Activation Key System**: Secure key-based user activation instead of direct payment updates
- **Access Control**: Only paid users can access questions (activated via keys)
- **Advanced Filtering**: Questions can be filtered by year, course, speciality, and chapter
- **Admin Dashboard**: Comprehensive statistics including activation key metrics
- **User Management**: Payment status and role management by Admin/Manager

## Database Schema

### Users
- `id`: Primary key
- `email`: Unique email address
- `username`: Unique username
- `hashed_password`: Encrypted password
- `user_type`: Enum (owner, admin, manager, student)
- `is_paid`: Boolean indicating payment status
- `year_of_study`: Year of study (for students)
- `speciality`: Academic speciality (for students)
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### Questions
- `id`: Primary key
- `year`: Year of the exam
- `course`: Course name
- `speciality`: Academic speciality
- `chapter`: Chapter or topic
- `number`: Question number
- `question_text`: The actual question
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Answers
- `id`: Primary key
- `question_id`: Foreign key to questions
- `answer_text`: The answer option
- `is_correct`: Boolean indicating if it's correct
- `option_label`: Answer label ('a', 'b', 'c', 'd', 'e')
- `created_at`: Creation timestamp

### Activation Keys
- `id`: Primary key
- `key`: Unique activation key
- `user_id`: Foreign key to user who used the key
- `is_used`: Boolean indicating if key was used
- `created_by`: Foreign key to admin/owner who created it
- `created_at`: Key creation timestamp
- `used_at`: Timestamp when key was used

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

## New Owner Role

The system now includes a special **OWNER** role with the following privileges:
- Full access to all system features and endpoints
- Bypasses payment requirements for accessing questions
- Can modify their own role (unlike admin users)
- Can delete their own account (unlike admin users)
- Has all admin and manager permissions plus additional owner-only features

### Pre-configured Owner Account
- **Email**: doudous6666@gmail.com
- **Username**: owner
- **Password**: 123456789

## Frontend Testing Interface

A complete frontend testing interface is available at `/frontend/index.html` that allows you to:
- Test all API endpoints with different user roles
- Quick login as the owner account
- Visually interact with all system features
- View formatted API responses

To use the frontend:
1. Start the backend server: `python run.py`
2. Serve the frontend: `cd frontend && python -m http.server 3000`
3. Open `http://localhost:3000` in your browser

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