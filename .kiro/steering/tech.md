# Technology Stack

## Backend

- **Framework**: FastAPI 0.104+
- **Language**: Python 3.8+
- **Server**: Uvicorn (ASGI)
- **ORM**: SQLAlchemy 2.0+
- **Database**: PostgreSQL 14+ (production), SQLite (development)
- **Migrations**: Alembic 1.12+
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt (passlib)
- **Validation**: Pydantic 2.5+

## Mobile Apps

### React Native App (Primary)
- **Framework**: React Native with Expo SDK 50
- **Language**: TypeScript 5.1+
- **Navigation**: React Navigation 6
- **State Management**: React Context API
- **Storage**: AsyncStorage
- **Styling**: NativeWind (Tailwind for React Native)
- **Forms**: React Hook Form
- **Icons**: Expo Vector Icons

### Next.js App (Alternative/Web)
- **Framework**: Next.js 15.2+
- **Language**: TypeScript 5+
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS 4+
- **Forms**: React Hook Form + Zod validation

## Common Commands

### Backend

```bash
# Setup
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Database
alembic upgrade head                    # Apply migrations
alembic revision --autogenerate -m "description"  # Create migration
alembic downgrade -1                    # Rollback one migration

# Run
python run.py                           # Development server (localhost:8000)

# Scripts
python scripts/create_owner.py          # Create owner user
python scripts/seed_data.py             # Seed test data
python scripts/import_questions.py questions.json  # Import questions
```

### React Native Mobile App

```bash
# Setup
cd react-native-med-app
npm install

# Run
npm start                               # Start Expo dev server
npm run android                         # Run on Android
npm run ios                             # Run on iOS (Mac only)

# Build
npm run build:android                   # Build Android APK
npm run build:ios                       # Build iOS IPA
```

### Next.js App

```bash
# Setup
cd medical-exam-app
npm install

# Run
npm run dev                             # Development server (localhost:3000)
npm run build                           # Production build
npm start                               # Production server

# Lint
npm run lint                            # Run ESLint
```

## Code Style

### Python (Backend)
- Follow PEP 8
- Use type hints
- Write docstrings for functions
- Use SQLAlchemy ORM (no raw SQL)
- Pydantic schemas for validation

### TypeScript (Mobile/Web)
- Use TypeScript strict mode
- Functional components only
- Use interfaces for props
- Follow React best practices
- Use hooks (no class components)

## API Documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Environment Variables

Backend requires `.env` file with:
- `DATABASE_URL`: Database connection string
- `SECRET_KEY`: JWT secret key
- `ALGORITHM`: JWT algorithm (HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiry (30)
