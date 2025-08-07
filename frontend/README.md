# MCQ Study App - Frontend Interface Collection

This directory contains multiple frontend interfaces for the MCQ Study App, including both API testing tools and a comprehensive medical student-focused app design.

## 🎨 Available Interfaces

### 1. **Medical Student App** (`medical-app.html`)
- **Purpose**: Main student dashboard and study interface
- **Features**: 
  - Professional medical-themed design
  - Study statistics and progress tracking
  - Subject-based navigation with medical icons
  - Interactive study modes and analytics
  - Responsive design for all devices

### 2. **Question Interface** (`question-interface.html`)
- **Purpose**: Interactive MCQ question answering
- **Features**:
  - Clean, focused question display
  - Medical image placeholders
  - Progress tracking and timer
  - Detailed explanations and feedback
  - Keyboard shortcuts and bookmarking

### 3. **Analytics Dashboard** (`analytics-dashboard.html`)
- **Purpose**: Comprehensive performance tracking
- **Features**:
  - Interactive charts and graphs
  - Subject-wise performance breakdown
  - Achievement system with medical milestones
  - Study pattern analysis
  - Progress visualization

### 4. **Design Assets Demo** (`design-assets.html`)
- **Purpose**: Showcase of design system and visual elements
- **Features**:
  - Medical-themed color palette
  - Icon system and visual assets
  - Responsive design mockups
  - UI component examples

### 5. **API Testing Interface** (`index.html`)
- **Purpose**: Backend API testing and development
- **Features**: 
  - Authentication testing
  - User management endpoints
  - Question CRUD operations
  - Admin dashboard testing

## 🏥 Medical App Features

### Visual Design System
- **Medical Color Palette**: Professional blues, greens, and medical gradients
- **Medical Icons**: Stethoscope, pills, microscope, anatomy symbols
- **Typography**: Clean, readable fonts optimized for study
- **Layout**: Card-based design with glass morphism effects

### Study-Focused Features
- **Progress Tracking**: Visual indicators for study progress
- **Subject Organization**: Medical subjects with appropriate icons
- **Achievement System**: Medical-themed badges and milestones
- **Responsive Design**: Optimized for desktop, tablet, and mobile

### Medical Subjects Included
- **Anatomy** 🦴 - Skeletal and organ systems
- **Physiology** ❤️ - Body functions and processes
- **Pathology** 🔬 - Disease mechanisms and diagnosis
- **Pharmacology** 💊 - Drug mechanisms and therapy
- **Surgery** 🔪 - Surgical procedures and techniques
- **Pediatrics** 👶 - Child health and development
- **Internal Medicine** 🩺 - Adult medical conditions
- **Cardiology** 💓 - Heart and cardiovascular system

## 🚀 Quick Start

### Demo Credentials
- **Username**: `owner`
- **Password**: `123456789`

### Running the Applications

1. **Start Backend** (Required):
   ```bash
   cd backend
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Serve Frontend**:
   ```bash
   cd frontend
   python -m http.server 3000
   ```

3. **Access Applications**:
   - **Main Medical App**: `http://localhost:3000/medical-app.html`
   - **Question Interface**: `http://localhost:3000/question-interface.html` 
   - **Analytics Dashboard**: `http://localhost:3000/analytics-dashboard.html`
   - **Design Assets**: `http://localhost:3000/design-assets.html`
   - **API Testing**: `http://localhost:3000/index.html`

## 🎯 Target Audience

### Medical Students
- USMLE preparation
- Medical board exam practice
- Anatomy and physiology review
- Clinical knowledge assessment

### Medical Educators
- Question bank management
- Student progress monitoring
- Course material organization
- Performance analytics

## 📱 Technical Specifications

### Frontend Technologies
- **HTML5**: Semantic structure and accessibility
- **CSS3**: Modern styling with gradients and animations
- **JavaScript**: Interactive functionality and API integration
- **Font Awesome 6.0**: Medical and UI icon library
- **Chart.js**: Interactive data visualization

### Design Principles
- **Mobile-First**: Responsive design starting from mobile
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimized loading and smooth interactions
- **User Experience**: Intuitive navigation and clear feedback

## 🔗 API Integration

All interfaces connect to the FastAPI backend for:
- **User Authentication**: JWT token-based security
- **Question Management**: CRUD operations for MCQs
- **Progress Tracking**: Study analytics and performance
- **Role-Based Access**: Different permissions for users

## 📄 Documentation

- **Design System**: See `README_DESIGN.md` for comprehensive design documentation
- **API Reference**: Backend `/docs` endpoint for API documentation
- **User Guide**: In-app help and tooltips for user guidance

## 🔄 Future Enhancements

- **PWA Support**: Offline functionality
- **Mobile Apps**: Native iOS and Android versions
- **Advanced Analytics**: Machine learning insights
- **Social Features**: Study groups and collaboration
- **Voice Commands**: Accessibility improvements

---

*Designed for medical students, built for the future of medical education* 🩺

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