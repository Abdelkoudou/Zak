# MCQ Study App - Frontend Testing Interface

This is a simple HTML/JavaScript frontend to test all the API endpoints of the MCQ Study App backend.

## Features

- **Authentication Testing**: Register, login, and check current user
- **User Management**: View, update, and manage users
- **Question Management**: Create, view, and filter questions
- **Admin Dashboard**: View statistics and manage the system

## How to Use

1. **Start the Backend**: Make sure the FastAPI backend is running on `http://localhost:8000`
2. **Open the Frontend**: Open `index.html` in your web browser
3. **Login as Owner**: Click "Quick Login as Owner" to login with the pre-created owner account
4. **Test Endpoints**: Use the different tabs to test various API endpoints

## Pre-configured Owner Account

- **Email**: doudous6666@gmail.com
- **Username**: owner
- **Password**: 123456789
- **Role**: owner (has full access to everything)

## User Roles

- **Owner**: Full access to all features (can rule everything)
- **Admin**: Manage users and questions, view dashboard
- **Manager**: Create questions, manage users (limited)
- **Student**: Access questions (if paid)

## Testing Different Roles

1. Login as the owner
2. Create new users with different roles using the Admin tab
3. Login as different users to test role-based permissions
4. Try accessing different features to see the permission system in action

## API Endpoints Covered

- `POST /auth/register` - User registration
- `POST /auth/token` - User login
- `GET /auth/me` - Get current user profile
- `GET /users/` - Get all users
- `GET /users/{id}` - Get user by ID
- `PUT /users/{id}` - Update user
- `GET /questions/` - Get questions with filtering
- `GET /questions/courses/list` - Get available courses
- `GET /questions/years/list` - Get available years
- `POST /questions/` - Create question
- `GET /admin/dashboard` - Get dashboard statistics
- `GET /admin/users` - Get all users (admin view)
- `PUT /admin/users/{id}/payment` - Update payment status
- `PUT /admin/users/{id}/role` - Update user role
- `DELETE /admin/users/{id}` - Delete user

## Notes

- The token is automatically saved in localStorage for persistence
- All responses are displayed in formatted JSON for easy inspection
- Error responses are highlighted in red, successful responses in green
- The owner role bypasses payment requirements and has full system access