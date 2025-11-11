# MCQ Study App - Medical Exam Preparation Platform

A comprehensive mobile application for medical students to practice MCQ questions, designed specifically for French medical education (Algerian market).

## 📱 Project Overview

**MCQ Study App** is a mobile-first platform that helps medical students prepare for their exams through:
- 📚 Structured MCQ questions (1st, 2nd, 3rd year)
- 💾 Save questions for later review
- 📊 Track test results and statistics
- 📖 Access course resources (Google Drive links)
- 🔐 Secure subscription-based access

---

## 🎯 Key Features

### For Students
- ✅ Browse questions by module, year, and exam type
- ✅ Practice with immediate feedback
- ✅ Save difficult questions
- ✅ Track progress and statistics
- ✅ Access course resources
- ✅ Multi-device support (max 2 devices)

### For Admins
- ✅ Manage questions and answers
- ✅ Generate activation keys
- ✅ Manage users and subscriptions
- ✅ View system statistics
- ✅ Add course resources

---

## 🏗️ Architecture

### Technology Stack

**Backend**:
- FastAPI (Python 3.8+)
- PostgreSQL / SQLite
- JWT Authentication
- SQLAlchemy ORM
- Alembic Migrations

**Mobile App**:
- React Native (Expo SDK 50)
- TypeScript
- React Navigation
- AsyncStorage
- Axios

---

## 📁 Project Structure

```
mcq-study-app/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── routers/        # API endpoints
│   │   ├── models.py       # Database models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── crud.py         # CRUD operations
│   │   └── main.py         # FastAPI app
│   ├── scripts/            # Utility scripts
│   ├── alembic/            # Database migrations
│   └── requirements.txt    # Python dependencies
│
├── react-native-med-app/   # React Native mobile app
│   ├── src/
│   │   ├── screens/        # App screens
│   │   ├── components/     # Reusable components
│   │   ├── services/       # API services
│   │   ├── navigation/     # Navigation config
│   │   └── context/        # React contexts
│   ├── assets/             # Images, fonts
│   └── package.json        # Node dependencies
│
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md     # System architecture
│   ├── FEATURES.md         # Feature specifications
│   ├── API_SPECIFICATION.md # API documentation
│   ├── DEVELOPMENT_PLAN.md # Development roadmap
│   └── DEPLOYMENT_GUIDE.md # Deployment instructions
│
└── README.md              # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL (production) or SQLite (development)
- Expo CLI (`npm install -g @expo/cli`)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp env_example.txt .env
# Edit .env with your settings

# Run migrations
alembic upgrade head

# Create owner user
python scripts/create_owner.py

# Start development server
python run.py
```

Backend will be available at `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### Mobile App Setup

```bash
# Navigate to mobile app directory
cd react-native-med-app

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on device
# Scan QR code with Expo Go app (iOS/Android)
# Or press 'a' for Android emulator
# Or press 'i' for iOS simulator (Mac only)
```

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design
- **[FEATURES.md](FEATURES.md)** - Complete feature specifications
- **[API_SPECIFICATION.md](API_SPECIFICATION.md)** - API endpoints documentation
- **[DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)** - Development timeline and tasks
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Production deployment guide

---

## 🔐 Default Credentials

### Owner Account (Backend)
```
Email: doudous6666@gmail.com
Username: owner
Password: 123456789
```

**⚠️ Important**: Change the password after first login!

### Demo Student Account (Mobile App)
```
Email: demo@student.com
Password: demo123
```

---

## 🎓 Medical Education Structure

The app supports the French medical education curriculum:

### 1st Year (1ère Année)
- **Annual Modules**: Anatomie, Biochimie, Biophysique, Biostatistique/Informatique, Chimie, Cytologie
  - Exam types: EMD1, EMD2, Rattrapage
- **Semestrial Modules**: Embryologie, Histologie, Physiologie, S.S.H
  - Exam types: EMD, Rattrapage

### 2nd Year (2ème Année)
- **Units (UEI)**: 
  - Appareil Cardio-vasculaire et Respiratoire
  - Appareil Digestif
  - Appareil Urinaire
  - Appareil Endocrinien et de la Reproduction
  - Appareil Nerveux et Organes des Sens
- **Standalone Modules**: Génétique, Immunologie
- Exam types: EMD, Rattrapage

### 3rd Year (3ème Année)
- **Units**: Similar structure to 2nd year
- **Standalone Modules**: Anatomie pathologique, Immunologie, Pharmacologie, Microbiologie, Parasitologie
- Exam types: EMD, Rattrapage

---

## 🛠️ Development

### Backend Development

```bash
# Run tests
pytest

# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Import questions from JSON
python scripts/import_questions.py questions.json

# Seed test data
python scripts/seed_data.py
```

### Mobile App Development

```bash
# Start with cache clear
npm start -- --clear

# Run on specific platform
npm run android
npm run ios

# Build for production
expo build:android
expo build:ios
```

---

## 📦 Deployment

### Backend Deployment Options

1. **Railway** (Easiest)
   - Cost: $5-10/month
   - Time: 15 minutes
   - Difficulty: ⭐ Very Easy

2. **DigitalOcean** (Best Value)
   - Cost: $6/month
   - Time: 1-2 hours
   - Difficulty: ⭐⭐⭐ Medium

3. **Heroku** (Simple)
   - Cost: $7/month
   - Time: 30 minutes
   - Difficulty: ⭐⭐ Easy

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

### Mobile App Distribution

- **Android**: Google Play Store ($25 one-time)
- **iOS**: Apple App Store ($99/year)
- **Direct**: APK distribution (Android only)

---

## 🔒 Security

- JWT token authentication
- Password hashing (bcrypt)
- Role-based access control (RBAC)
- Device session limits (max 2 per user)
- HTTPS in production
- SQL injection prevention (SQLAlchemy ORM)

---

## 📊 Current Status

### Completed (85%)
- ✅ Backend API (85% complete)
- ✅ Authentication system
- ✅ User management
- ✅ Question CRUD
- ✅ Admin dashboard
- ✅ React Native app structure (60% complete)
- ✅ UI components
- ✅ Navigation
- ✅ Authentication screens

### In Progress (15%)
- 🔄 Saved questions feature
- 🔄 Course resources
- 🔄 Test results tracking
- 🔄 API integration
- 🔄 Mobile app completion

### Timeline
- **Estimated Completion**: 10-12 days
- **MVP Launch**: 2 weeks

---

## 🤝 Contributing

### Development Workflow

1. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes
   ```bash
   git add .
   git commit -m "Add your feature"
   ```

3. Push to repository
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create Pull Request

### Code Style

**Backend (Python)**:
- Follow PEP 8
- Use type hints
- Write docstrings
- Add tests

**Mobile (TypeScript)**:
- Use TypeScript strict mode
- Follow React best practices
- Use functional components
- Add PropTypes/interfaces

---

## 📝 API Documentation

### Base URL
- Development: `http://localhost:8000`
- Production: `https://api.mcqstudy.com`

### Key Endpoints

**Authentication**:
- `POST /auth/register` - Register new user
- `POST /auth/token` - Login and get JWT token
- `GET /auth/me` - Get current user

**Questions**:
- `GET /questions/` - List questions (with filters)
- `GET /questions/{id}` - Get single question
- `POST /questions/` - Create question (admin)

**Admin**:
- `GET /admin/dashboard` - System statistics
- `POST /admin/activation-keys` - Generate key
- `GET /admin/users` - List all users

See [API_SPECIFICATION.md](API_SPECIFICATION.md) for complete documentation.

---

## 🐛 Troubleshooting

### Backend Issues

**Database connection error**:
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Check DATABASE_URL in .env
```

**Migration error**:
```bash
# Reset migrations (development only)
alembic downgrade base
alembic upgrade head
```

### Mobile App Issues

**Metro bundler error**:
```bash
# Clear cache
expo start -c
```

**Dependency error**:
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## 📈 Roadmap

### Phase 1 (Current - MVP)
- ✅ Core MCQ features
- ✅ User authentication
- ✅ Admin dashboard
- 🔄 Saved questions
- 🔄 Course resources
- 🔄 Test results

### Phase 2 (Post-Launch)
- Study timer
- Advanced analytics
- Push notifications
- Offline mode
- Dark mode
- Search functionality

### Phase 3 (Growth)
- Arabic language support
- Payment gateway integration
- Gamification (badges, streaks)
- Social features
- Web app version

---

## 💰 Costs

### Development
- Solo developer: 10-12 days
- Two developers: 7-8 days
- Three developers: 5-6 days

### Infrastructure (Monthly)
- Backend hosting: $6-12
- Domain: $1-2
- **Total**: $7-14/month

### One-Time
- Google Play: $25
- Apple Developer: $99/year
- **Total**: $25-124

---

## 📞 Support

### Documentation
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- Features: [FEATURES.md](FEATURES.md)
- API: [API_SPECIFICATION.md](API_SPECIFICATION.md)
- Development: [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)
- Deployment: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

### Contact
- Email: support@mcqstudy.com
- GitHub Issues: [Create an issue](https://github.com/yourusername/mcq-study-app/issues)

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🙏 Acknowledgments

- FastAPI for the excellent Python framework
- Expo for simplifying React Native development
- PostgreSQL for reliable database
- All contributors and testers

---

## 🎉 Getting Started

Ready to start? Follow these steps:

1. **Read the documentation**
   - Start with [ARCHITECTURE.md](ARCHITECTURE.md)
   - Review [FEATURES.md](FEATURES.md)
   - Check [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)

2. **Setup development environment**
   - Follow [Quick Start](#-quick-start) above
   - Test backend API
   - Test mobile app

3. **Start developing**
   - Pick a task from [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)
   - Create a feature branch
   - Code and test
   - Submit pull request

4. **Deploy to production**
   - Follow [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
   - Test thoroughly
   - Launch! 🚀

---

**Built with ❤️ for medical students**

*Last updated: January 2024*
