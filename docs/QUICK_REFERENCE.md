# MCQ Study App - Quick Reference Guide

A quick reference for common tasks and commands.

---

## 🚀 Quick Start Commands

### Backend

```bash
# Start development server
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python run.py

# Run with auto-reload
uvicorn app.main:app --reload

# Access API docs
open http://localhost:8000/docs
```

### Mobile App

```bash
# Start Expo
cd react-native-med-app
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Clear cache
npm start -- --clear
```

---

## 📦 Installation

### First Time Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp env_example.txt .env
alembic upgrade head
python scripts/create_owner.py

# Mobile App
cd react-native-med-app
npm install
```

---

## 🗄️ Database Commands

### Migrations

```bash
cd backend
source venv/bin/activate

# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Rollback all
alembic downgrade base

# View migration history
alembic history

# Current version
alembic current
```

### Database Management

```bash
# Create owner user
python scripts/create_owner.py

# Seed test data
python scripts/seed_data.py

# Import questions
python scripts/import_questions.py questions.json

# Connect to database (PostgreSQL)
psql -U mcq_user -d mcq_study_db

# Connect to database (SQLite)
sqlite3 mcq_study.db
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
source venv/bin/activate

# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_questions.py

# Run specific test
pytest tests/test_questions.py::test_create_question

# Verbose output
pytest -v
```

### Mobile App Tests

```bash
cd react-native-med-app

# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Update snapshots
npm test -- -u
```

---

## 🔍 Debugging

### Backend Debugging

```bash
# View logs
tail -f logs/app.log

# Check service status (production)
systemctl status mcq-app

# View service logs (production)
journalctl -u mcq-app -f

# Python debugger
import pdb; pdb.set_trace()
```

### Mobile App Debugging

```bash
# React Native Debugger
# Press Cmd+D (iOS) or Cmd+M (Android)
# Select "Debug"

# View logs
npx react-native log-android
npx react-native log-ios

# Clear cache
rm -rf node_modules
npm install
npm start -- --reset-cache
```

---

## 📝 Common API Endpoints

### Authentication

```bash
# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"test","password":"test123"}'

# Login
curl -X POST http://localhost:8000/auth/token \
  -d "username=owner&password=123456789"

# Get current user
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Questions

```bash
# Get questions
curl http://localhost:8000/questions/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get questions with filters
curl "http://localhost:8000/questions/?study_year=2&module=Anatomie" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get single question
curl http://localhost:8000/questions/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Admin

```bash
# Generate activation key
curl -X POST http://localhost:8000/admin/activation-keys \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get dashboard stats
curl http://localhost:8000/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=sqlite:///./mcq_study.db
# DATABASE_URL=postgresql://user:pass@localhost:5432/mcq_study_db

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (optional)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006
```

### Mobile App

```typescript
// src/config.ts
export const API_BASE_URL = __DEV__
  ? 'http://localhost:8000'
  : 'https://api.mcqstudy.com';
```

---

## 🚢 Deployment

### Backend Deployment (Railway)

```bash
# Login to Railway
railway login

# Link project
railway link

# Deploy
git push origin main
# Railway auto-deploys

# View logs
railway logs

# Run migrations
railway run alembic upgrade head
```

### Backend Deployment (DigitalOcean)

```bash
# SSH to server
ssh root@your_server_ip

# Update code
cd /var/www/mcq-app
git pull origin main

# Restart service
systemctl restart mcq-app

# View logs
journalctl -u mcq-app -f
```

### Mobile App Build

```bash
cd react-native-med-app

# Build Android APK
expo build:android -t apk

# Build Android AAB (for Play Store)
expo build:android -t app-bundle

# Build iOS
expo build:ios

# Check build status
expo build:status
```

---

## 🐛 Troubleshooting

### Backend Issues

```bash
# Port already in use
lsof -ti:8000 | xargs kill -9

# Database connection error
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running: systemctl status postgresql

# Migration error
alembic downgrade -1
alembic upgrade head

# Import error
# Ensure virtual environment is activated
source venv/bin/activate
```

### Mobile App Issues

```bash
# Metro bundler error
npx react-native start --reset-cache

# Dependency error
rm -rf node_modules package-lock.json
npm install

# iOS build error (Mac)
cd ios
pod install
cd ..

# Android build error
cd android
./gradlew clean
cd ..

# Expo error
expo doctor
```

---

## 📊 Useful SQL Queries

### User Statistics

```sql
-- Total users
SELECT COUNT(*) FROM users;

-- Paid vs unpaid
SELECT is_paid, COUNT(*) FROM users GROUP BY is_paid;

-- Users by role
SELECT user_type, COUNT(*) FROM users GROUP BY user_type;
```

### Question Statistics

```sql
-- Total questions
SELECT COUNT(*) FROM questions;

-- Questions by module
SELECT module, COUNT(*) FROM questions GROUP BY module;

-- Questions by year
SELECT year, COUNT(*) FROM questions GROUP BY year ORDER BY year DESC;

-- Questions with most answers
SELECT q.id, q.question_text, COUNT(a.id) as answer_count
FROM questions q
LEFT JOIN answers a ON q.id = a.question_id
GROUP BY q.id
ORDER BY answer_count DESC
LIMIT 10;
```

### Activation Keys

```sql
-- Total keys
SELECT COUNT(*) FROM activation_keys;

-- Used vs unused
SELECT is_used, COUNT(*) FROM activation_keys GROUP BY is_used;

-- Recently used keys
SELECT * FROM activation_keys 
WHERE is_used = true 
ORDER BY used_at DESC 
LIMIT 10;
```

---

## 🔑 Default Credentials

### Owner Account

```
Email: doudous6666@gmail.com
Username: owner
Password: 123456789
```

### Demo Student

```
Email: demo@student.com
Password: demo123
```

---

## 📱 Mobile App Navigation

### Screen Routes

```typescript
// Auth Stack
- Login
- Signup

// Main Stack
- Home
- Practice
- QuestionDetail
- SavedQuestions
- Resources
- TestHistory
- Analytics
- Profile

// Admin Stack (if admin)
- Dashboard
- UserManagement
- QuestionManagement
```

---

## 🎨 UI Components

### Available Components

```typescript
// src/components/ui/
- Button
- Card
- Input
- Badge
- Alert
- Progress

// Usage
import { Button } from '../components/ui/Button';

<Button onPress={handlePress} variant="primary">
  Click Me
</Button>
```

---

## 📦 Package Management

### Backend

```bash
# Add package
pip install package-name
pip freeze > requirements.txt

# Update package
pip install --upgrade package-name

# Remove package
pip uninstall package-name
```

### Mobile App

```bash
# Add package
npm install package-name

# Add dev dependency
npm install --save-dev package-name

# Update package
npm update package-name

# Remove package
npm uninstall package-name

# Check outdated
npm outdated
```

---

## 🔄 Git Workflow

### Daily Workflow

```bash
# Start of day
git checkout main
git pull upstream main
git checkout -b feature/my-feature

# During development
git add .
git commit -m "feat: add feature"

# End of day
git push origin feature/my-feature

# Create PR on GitHub
```

### Sync with Upstream

```bash
# Fetch latest changes
git fetch upstream

# Update main branch
git checkout main
git merge upstream/main

# Update feature branch
git checkout feature/my-feature
git rebase main
```

---

## 📈 Performance Monitoring

### Backend

```bash
# Check memory usage
ps aux | grep uvicorn

# Check CPU usage
top -p $(pgrep -f uvicorn)

# Database connections
SELECT count(*) FROM pg_stat_activity;

# Slow queries (PostgreSQL)
SELECT query, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Mobile App

```bash
# Bundle size
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android.bundle

# Check bundle size
ls -lh android.bundle
```

---

## 🔐 Security Checklist

### Before Deployment

- [ ] Change SECRET_KEY
- [ ] Use strong database password
- [ ] Enable HTTPS
- [ ] Update CORS settings
- [ ] Remove debug logs
- [ ] Disable debug mode
- [ ] Set up firewall
- [ ] Enable rate limiting
- [ ] Review permissions
- [ ] Test authentication

---

## 📞 Quick Links

- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health
- **Expo DevTools**: http://localhost:19002

---

## 💡 Tips & Tricks

### Backend

```python
# Quick test endpoint
@router.get("/test")
def test():
    return {"message": "It works!"}

# Debug SQL queries
from sqlalchemy import event
from sqlalchemy.engine import Engine

@event.listens_for(Engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, params, context, executemany):
    print("SQL:", statement)
```

### Mobile App

```typescript
// Quick console log
console.log('Debug:', variable);

// JSON stringify for objects
console.log('Object:', JSON.stringify(object, null, 2));

// Performance timing
console.time('operation');
// ... code ...
console.timeEnd('operation');
```

---

## 🎯 Next Steps

1. Read [ARCHITECTURE.md](ARCHITECTURE.md) for system overview
2. Check [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) for tasks
3. Review [API_SPECIFICATION.md](API_SPECIFICATION.md) for endpoints
4. Follow [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines

---

**Keep this guide handy for quick reference!** 📚
