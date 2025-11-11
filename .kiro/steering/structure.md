# Project Structure

## Repository Organization

This is a monorepo containing multiple applications:

```
mcq-study-app/
├── backend/                    # FastAPI backend (PRIMARY)
├── react-native-med-app/       # React Native mobile app (PRIMARY)
├── medical-exam-app/           # Next.js web app (ALTERNATIVE)
├── frontend/                   # Legacy HTML files (DEPRECATED)
└── docs/                       # Markdown documentation
```

## Backend Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app initialization, CORS, middleware
│   ├── database.py             # Database connection and session management
│   ├── models.py               # SQLAlchemy models (User, Question, Answer, etc.)
│   ├── schemas.py              # Pydantic schemas for request/response validation
│   ├── crud.py                 # CRUD operations (database queries)
│   ├── auth.py                 # JWT authentication logic
│   ├── permissions.py          # Authorization decorators (@require_admin, etc.)
│   ├── constants.py            # Medical structure constants (modules, exam types)
│   └── routers/
│       ├── auth.py             # Auth endpoints (/auth/register, /auth/token)
│       ├── users.py            # User management (/users/*)
│       ├── questions.py        # Question endpoints (/questions/*)
│       └── admin.py            # Admin endpoints (/admin/*)
├── scripts/
│   ├── create_owner.py         # Create initial owner user
│   ├── seed_data.py            # Seed test data
│   └── import_questions.py     # Import questions from JSON
├── alembic/                    # Database migrations
│   ├── versions/               # Migration files
│   └── env.py                  # Alembic configuration
├── .env                        # Environment variables (not in git)
├── requirements.txt            # Python dependencies
└── run.py                      # Development server entry point
```

## React Native App Structure

```
react-native-med-app/
├── src/
│   ├── components/
│   │   └── ui/                 # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       └── ...
│   ├── screens/                # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── PracticeScreen.tsx
│   │   └── ...
│   ├── navigation/
│   │   └── AppNavigator.tsx    # Navigation configuration
│   ├── context/
│   │   └── AuthProvider.tsx    # Authentication context
│   ├── services/               # API services
│   │   ├── api.ts              # Axios client configuration
│   │   ├── auth.ts             # Auth API calls
│   │   └── questions.ts        # Questions API calls
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   └── utils/
│       └── storage.ts          # AsyncStorage helpers
├── assets/                     # Images, fonts, icons
├── App.tsx                     # Root component
├── app.json                    # Expo configuration
└── package.json
```

## Database Models

Key models in `backend/app/models.py`:

- **User**: User accounts with roles (owner, admin, manager, student)
- **Question**: MCQ questions with metadata (year, module, exam type)
- **Answer**: Answer options linked to questions
- **ActivationKey**: Subscription activation keys
- **DeviceSession**: Device tracking (max 2 per user)
- **SavedQuestion**: User's saved questions (to be added)
- **TestAttempt**: Test results tracking (to be added)
- **CourseResource**: Course materials links (to be added)

## API Architecture

Layered architecture pattern:

1. **Router Layer** (`app/routers/`): HTTP request handlers
2. **Business Logic** (`app/crud.py`): CRUD operations
3. **Data Access** (`app/models.py`): SQLAlchemy models
4. **Database**: PostgreSQL/SQLite

## Authentication Flow

1. User logs in via `/auth/token`
2. Backend validates credentials and returns JWT token
3. Client stores token in AsyncStorage
4. Client includes token in Authorization header for protected endpoints
5. Backend validates token using dependency injection

## Role-Based Access Control

Hierarchy: Owner > Admin > Manager > Student

- **Owner**: Full system access, cannot be modified
- **Admin**: User management, question management, key generation
- **Manager**: Question management only
- **Student**: Browse questions (if paid), practice, save questions

## File Naming Conventions

- **Python**: snake_case for files and functions
- **TypeScript**: PascalCase for components, camelCase for utilities
- **Screens**: `*Screen.tsx` suffix
- **Components**: PascalCase (e.g., `Button.tsx`)
- **Services**: camelCase (e.g., `api.ts`)

## Important Notes

- The `frontend/` folder contains legacy HTML files and should not be used for new development
- The `medical-exam-app/` is an alternative Next.js implementation
- Primary development focus is on `backend/` and `react-native-med-app/`
- All new features should be added to the React Native app
