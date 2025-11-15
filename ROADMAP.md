# MCQ Study App - Complete Roadmap

**Project**: Medical Exam Preparation Platform for Algerian Students  
**Architecture**: React Native + Expo + Supabase + JSON  
**Timeline**: 5 days to MVP  
**Cost**: $0/month (up to 50,000 users)  
**Last Updated**: January 2024

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Decision](#architecture-decision)
3. [Technical Stack](#technical-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [JSON Structure](#json-structure)
7. [Implementation Plan](#implementation-plan)
8. [Features Breakdown](#features-breakdown)
9. [Cost Analysis](#cost-analysis)
10. [Scalability Plan](#scalability-plan)
11. [Deployment Strategy](#deployment-strategy)
12. [Success Metrics](#success-metrics)

---

## Executive Summary

### The Problem
Algerian medical students need a mobile app to practice MCQ questions based on the French medical curriculum, with offline support and instant content updates.

### The Solution
A React Native mobile app using:
- **Supabase** for authentication and user data
- **JSON files** for questions (bundled + remote updates)
- **Offline-first** architecture for poor internet connectivity
- **Instant updates** without app store approval

### Key Benefits
- ✅ **$0 hosting cost** (up to 50,000 users)
- ✅ **5-day development** (vs 10-12 days)
- ✅ **10x faster** question loading
- ✅ **Offline-first** by default
- ✅ **Instant updates** (no app store approval)
- ✅ **Simpler architecture** (no backend server)

---

## Architecture Decision

### Why We Changed from FastAPI + PostgreSQL


#### Original Architecture (Rejected)

```
┌─────────────────────────────────────────┐
│         Mobile App (React Native)       │
│                  ↓                      │
│         HTTP API Requests               │
│                  ↓                      │
│    ┌──────────────────────────┐        │
│    │   FastAPI Backend        │        │
│    │   - Python 3.8+          │        │
│    │   - JWT Authentication   │        │
│    │   - SQLAlchemy ORM       │        │
│    │   - Alembic Migrations   │        │
│    └──────────────────────────┘        │
│                  ↓                      │
│    ┌──────────────────────────┐        │
│    │   PostgreSQL Database    │        │
│    │   - Users                │        │
│    │   - Questions            │        │
│    │   - Answers              │        │
│    │   - Test Results         │        │
│    └──────────────────────────┘        │
└─────────────────────────────────────────┘

Issues:
❌ Backend hosting: $6-12/month
❌ Complex deployment (server + database)
❌ Slow question loading (100-300ms)
❌ No offline support
❌ Updates require app store approval
❌ 10-12 days development time
```

#### New Architecture (Approved)

```
┌─────────────────────────────────────────────────────┐
│         Mobile App (React Native + Expo)            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐      ┌──────────────────┐   │
│  │   Questions      │      │   User Data      │   │
│  │   (JSON Files)   │      │   (Supabase)     │   │
│  │                  │      │                  │   │
│  │  - Local Storage │      │  - Auth          │   │
│  │  - Bundled       │      │  - Profiles      │   │
│  │  - Offline       │      │  - Saved Qs      │   │
│  │  - Fast (10ms)   │      │  - Test Results  │   │
│  └──────────────────┘      │  - Act. Keys     │   │
│         ↓                  └──────────────────┘   │
│  ┌──────────────────┐             ↓               │
│  │  Remote Updates  │      ┌──────────────────┐   │
│  │  (Supabase       │←─────│   Supabase       │   │
│  │   Storage)       │      │   (Managed)      │   │
│  └──────────────────┘      └──────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘

Benefits:
✅ $0 hosting (up to 50K users)
✅ Simple deployment (just Supabase)
✅ Fast question loading (10-30ms)
✅ Full offline support
✅ Instant updates (no app store)
✅ 5 days development time
```

### Decision Rationale

| Criteria | FastAPI + PostgreSQL | Supabase + JSON | Winner |
|----------|---------------------|-----------------|--------|
| **Development Time** | 10-12 days | 5 days | ✅ JSON |
| **Cost (0-50K users)** | $72-144/year | $0 | ✅ JSON |
| **Question Loading** | 120-350ms | 10-30ms | ✅ JSON |
| **Offline Support** | Poor | Excellent | ✅ JSON |
| **Update Speed** | 3-7 days | 5 minutes | ✅ JSON |
| **Maintenance** | High | Low | ✅ JSON |
| **Scalability** | Good | Excellent | ✅ JSON |
| **Flexibility** | High | Medium | ⚠️ FastAPI |
| **Complex Queries** | Excellent | Limited | ⚠️ FastAPI |

**Verdict**: Supabase + JSON is superior for this question bank app.

---

## Technical Stack

### Frontend (Mobile App)

```
Framework: React Native with Expo SDK 50
Language: TypeScript 5.1+
Navigation: React Navigation 6
State Management: React Context API + Hooks
Storage: AsyncStorage (local data)
Styling: NativeWind (Tailwind for React Native)
Forms: React Hook Form
Icons: Expo Vector Icons
HTTP Client: Supabase SDK (auto-generated)
```

### Backend (Supabase)

```
Authentication: Supabase Auth (email/password)
Database: PostgreSQL (managed by Supabase)
Storage: Supabase Storage (JSON files)
API: Auto-generated REST API
Real-time: Supabase Realtime (optional)
Row Level Security: Built-in
```

### Questions (JSON Files)

```
Format: JSON
Storage: Local (bundled) + Remote (Supabase Storage)
Structure: Modular (split by year/module)
Size: 1.5-3.5MB per module
Updates: Version-based incremental updates
```

### Development Tools

```
IDE: VS Code
Version Control: Git + GitHub
Package Manager: npm
Testing: Expo Go (development)
Build: EAS Build (Expo Application Services)
Deployment: Google Play Store + Apple App Store
```

---

## Project Structure


### Complete Directory Structure

```
mcq-study-app/
│
├── mobile-app/                          # React Native + Expo
│   ├── src/
│   │   ├── components/                  # Reusable UI components
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Alert.tsx
│   │   │   │   └── Progress.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── AnswerOption.tsx
│   │   │   └── ModuleCard.tsx
│   │   │
│   │   ├── screens/                     # App screens
│   │   │   ├── auth/
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   └── SignupScreen.tsx
│   │   │   ├── main/
│   │   │   │   ├── HomeScreen.tsx
│   │   │   │   ├── PracticeScreen.tsx
│   │   │   │   ├── QuestionDetailScreen.tsx
│   │   │   │   ├── SavedQuestionsScreen.tsx
│   │   │   │   ├── ResourcesScreen.tsx
│   │   │   │   ├── TestHistoryScreen.tsx
│   │   │   │   ├── AnalyticsScreen.tsx
│   │   │   │   └── ProfileScreen.tsx
│   │   │   └── admin/
│   │   │       └── AdminDashboardScreen.tsx
│   │   │
│   │   ├── navigation/                  # Navigation configuration
│   │   │   ├── AppNavigator.tsx
│   │   │   ├── AuthNavigator.tsx
│   │   │   └── MainNavigator.tsx
│   │   │
│   │   ├── services/                    # Business logic
│   │   │   ├── supabase.ts             # Supabase client
│   │   │   ├── auth.ts                 # Authentication
│   │   │   ├── questions.ts            # Question management
│   │   │   ├── savedQuestions.ts       # Saved questions
│   │   │   ├── testResults.ts          # Test results
│   │   │   ├── resources.ts            # Course resources
│   │   │   └── updates.ts              # JSON updates
│   │   │
│   │   ├── context/                     # React Context
│   │   │   ├── AuthContext.tsx
│   │   │   └── QuestionsContext.tsx
│   │   │
│   │   ├── hooks/                       # Custom hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useQuestions.ts
│   │   │   └── useOffline.ts
│   │   │
│   │   ├── types/                       # TypeScript types
│   │   │   ├── index.ts
│   │   │   ├── question.ts
│   │   │   ├── user.ts
│   │   │   └── supabase.ts
│   │   │
│   │   ├── utils/                       # Utility functions
│   │   │   ├── storage.ts
│   │   │   ├── validation.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── data/                        # Bundled data
│   │   │   └── questions/
│   │   │       ├── version.json
│   │   │       ├── year1_anatomie.json
│   │   │       ├── year1_biochimie.json
│   │   │       ├── year2_cardio.json
│   │   │       └── ...
│   │   │
│   │   └── config/                      # Configuration
│   │       ├── supabase.ts
│   │       └── constants.ts
│   │
│   ├── assets/                          # Images, fonts, icons
│   │   ├── images/
│   │   ├── fonts/
│   │   └── icons/
│   │
│   ├── App.tsx                          # Root component
│   ├── app.json                         # Expo configuration
│   ├── package.json                     # Dependencies
│   ├── tsconfig.json                    # TypeScript config
│   └── .env                             # Environment variables
│
├── admin-panel/                         # Web admin (optional)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── QuestionForm.tsx
│   │   │   ├── QuestionList.tsx
│   │   │   └── ExportJSON.tsx
│   │   └── services/
│   │       └── supabase.ts
│   ├── package.json
│   └── index.html
│
├── questions/                           # JSON source files
│   ├── version.json
│   ├── year1/
│   │   ├── anatomie.json
│   │   ├── biochimie.json
│   │   └── ...
│   ├── year2/
│   │   ├── cardio.json
│   │   └── ...
│   └── year3/
│       └── ...
│
├── docs/                                # Documentation
│   ├── ROADMAP.md                       # This file
│   ├── ARCHITECTURE.md
│   ├── FEATURES.md
│   ├── API_SPECIFICATION.md
│   └── DEPLOYMENT_GUIDE.md
│
├── .kiro/                               # Kiro steering files
│   └── steering/
│       ├── structure.md
│       ├── tech.md
│       └── product.md
│
├── README.md                            # Project overview
├── .gitignore
└── LICENSE
```

### Files to Delete

```
❌ DELETE (Not needed anymore):
├── backend/                             # Entire FastAPI backend
├── medical-exam-app/                    # Next.js alternative
├── frontend/                            # Legacy HTML files
└── alembic/                             # Database migrations
```

---

## Database Schema

### Supabase Tables

#### 1. Profiles (User Data)

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  study_year INTEGER CHECK (study_year IN (1, 2, 3)),
  speciality TEXT CHECK (speciality IN ('Médecine', 'Pharmacie', 'Dentaire')),
  is_paid BOOLEAN DEFAULT FALSE,
  payment_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_is_paid ON profiles(is_paid);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

#### 2. Saved Questions

```sql
CREATE TABLE saved_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  question_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Indexes
CREATE INDEX idx_saved_questions_user ON saved_questions(user_id);
CREATE INDEX idx_saved_questions_question ON saved_questions(question_id);

-- Row Level Security
ALTER TABLE saved_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved questions" ON saved_questions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved questions" ON saved_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved questions" ON saved_questions
  FOR DELETE USING (auth.uid() = user_id);
```

#### 3. Test Attempts

```sql
CREATE TABLE test_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  module TEXT NOT NULL,
  study_year INTEGER NOT NULL,
  questions_attempted INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  score_percentage FLOAT NOT NULL,
  time_spent INTEGER NOT NULL, -- in seconds
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_test_attempts_user ON test_attempts(user_id);
CREATE INDEX idx_test_attempts_module ON test_attempts(module);
CREATE INDEX idx_test_attempts_created ON test_attempts(created_at DESC);

-- Row Level Security
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own test attempts" ON test_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test attempts" ON test_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### 4. Activation Keys

```sql
CREATE TABLE activation_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES auth.users,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_activation_keys_key ON activation_keys(key);
CREATE INDEX idx_activation_keys_is_used ON activation_keys(is_used);

-- Row Level Security
ALTER TABLE activation_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view unused keys" ON activation_keys
  FOR SELECT USING (is_used = FALSE);

CREATE POLICY "Admins can insert keys" ON activation_keys
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND username IN ('owner', 'admin')
    )
  );
```

#### 5. Device Sessions

```sql
CREATE TABLE device_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  last_seen TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, device_fingerprint)
);

-- Indexes
CREATE INDEX idx_device_sessions_user ON device_sessions(user_id);
CREATE INDEX idx_device_sessions_last_seen ON device_sessions(last_seen DESC);

-- Row Level Security
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own device sessions" ON device_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own device sessions" ON device_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own device sessions" ON device_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own device sessions" ON device_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger to enforce max 2 devices per user
CREATE OR REPLACE FUNCTION enforce_device_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM device_sessions WHERE user_id = NEW.user_id) >= 2 THEN
    -- Delete oldest device session
    DELETE FROM device_sessions
    WHERE id = (
      SELECT id FROM device_sessions
      WHERE user_id = NEW.user_id
      ORDER BY last_seen ASC
      LIMIT 1
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER device_limit_trigger
  BEFORE INSERT ON device_sessions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_device_limit();
```

#### 6. Course Resources

```sql
CREATE TABLE course_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT CHECK (category IN ('drive', 'telegram', 'pdf', 'video')),
  year INTEGER,
  study_year INTEGER,
  module TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_resources_category ON course_resources(category);
CREATE INDEX idx_resources_module ON course_resources(module);
CREATE INDEX idx_resources_study_year ON course_resources(study_year);

-- Row Level Security
ALTER TABLE course_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resources" ON course_resources
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can insert resources" ON course_resources
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND username IN ('owner', 'admin', 'manager')
    )
  );
```

---

## JSON Structure


### Version File

```json
{
  "version": "1.2.0",
  "last_updated": "2024-01-15T10:30:00Z",
  "modules": {
    "year1_anatomie": {
      "version": "1.1.0",
      "size": 2457600,
      "questions_count": 500,
      "last_updated": "2024-01-10T08:00:00Z"
    },
    "year1_biochimie": {
      "version": "1.0.0",
      "size": 1966080,
      "questions_count": 400,
      "last_updated": "2024-01-05T12:00:00Z"
    },
    "year2_cardio": {
      "version": "1.2.0",
      "size": 2949120,
      "questions_count": 600,
      "last_updated": "2024-01-15T10:30:00Z"
    }
  },
  "changelog": [
    {
      "version": "1.2.0",
      "date": "2024-01-15",
      "changes": "Added 50 new cardiology questions for 2024 EMD"
    },
    {
      "version": "1.1.0",
      "date": "2024-01-10",
      "changes": "Updated anatomy questions, fixed 5 errors"
    }
  ]
}
```

### Question Module File

```json
{
  "version": "1.1.0",
  "module": "Anatomie",
  "study_year": 1,
  "exam_types": ["EMD1", "EMD2", "Rattrapage"],
  "last_updated": "2024-01-10T08:00:00Z",
  "questions_count": 500,
  "questions": [
    {
      "id": "2024_anatomie_001",
      "year": 2024,
      "study_year": 1,
      "module": "Anatomie",
      "speciality": "Médecine",
      "cours": ["Anatomie générale", "Système cardiovasculaire"],
      "exam_type": "EMD1",
      "number": 1,
      "question_text": "Quelle est la fonction principale du cœur?",
      "question_image": null,
      "answers": [
        {
          "label": "A",
          "text": "Pomper le sang dans tout le corps",
          "image": null,
          "is_correct": true
        },
        {
          "label": "B",
          "text": "Filtrer le sang et éliminer les toxines",
          "image": null,
          "is_correct": false
        },
        {
          "label": "C",
          "text": "Produire des globules rouges",
          "image": null,
          "is_correct": false
        },
        {
          "label": "D",
          "text": "Stocker l'oxygène pour les muscles",
          "image": null,
          "is_correct": false
        },
        {
          "label": "E",
          "text": "Réguler la température corporelle",
          "image": null,
          "is_correct": false
        }
      ],
      "explanation": "Le cœur est un muscle qui pompe le sang oxygéné vers tous les organes du corps.",
      "difficulty": "easy",
      "tags": ["cardiovasculaire", "anatomie", "physiologie"]
    },
    {
      "id": "2024_anatomie_002",
      "year": 2024,
      "study_year": 1,
      "module": "Anatomie",
      "speciality": "Médecine",
      "cours": ["Système respiratoire"],
      "exam_type": "EMD1",
      "number": 2,
      "question_text": "Combien de lobes possède le poumon droit?",
      "question_image": null,
      "answers": [
        {
          "label": "A",
          "text": "1 lobe",
          "image": null,
          "is_correct": false
        },
        {
          "label": "B",
          "text": "2 lobes",
          "image": null,
          "is_correct": false
        },
        {
          "label": "C",
          "text": "3 lobes",
          "image": null,
          "is_correct": true
        },
        {
          "label": "D",
          "text": "4 lobes",
          "image": null,
          "is_correct": false
        },
        {
          "label": "E",
          "text": "5 lobes",
          "image": null,
          "is_correct": false
        }
      ],
      "explanation": "Le poumon droit possède 3 lobes (supérieur, moyen, inférieur), tandis que le poumon gauche n'en a que 2.",
      "difficulty": "medium",
      "tags": ["respiratoire", "anatomie"]
    }
  ]
}
```

### File Organization

```
Supabase Storage Bucket: "questions"
│
├── version.json                         # Master version file
│
├── year1/
│   ├── anatomie.json                    # 500 questions, ~2.5MB
│   ├── biochimie.json                   # 400 questions, ~2MB
│   ├── biophysique.json                 # 350 questions, ~1.8MB
│   ├── biostatistique.json              # 300 questions, ~1.5MB
│   ├── chimie.json                      # 400 questions, ~2MB
│   ├── cytologie.json                   # 350 questions, ~1.8MB
│   ├── embryologie.json                 # 300 questions, ~1.5MB
│   ├── histologie.json                  # 400 questions, ~2MB
│   ├── physiologie.json                 # 450 questions, ~2.3MB
│   └── ssh.json                         # 250 questions, ~1.3MB
│
├── year2/
│   ├── cardio_respiratoire.json         # 600 questions, ~3MB
│   ├── digestif.json                    # 500 questions, ~2.5MB
│   ├── urinaire.json                    # 400 questions, ~2MB
│   ├── endocrinien.json                 # 450 questions, ~2.3MB
│   ├── nerveux.json                     # 550 questions, ~2.8MB
│   ├── genetique.json                   # 300 questions, ~1.5MB
│   └── immunologie.json                 # 350 questions, ~1.8MB
│
└── year3/
    ├── cardio.json                      # 500 questions, ~2.5MB
    ├── psychologie.json                 # 300 questions, ~1.5MB
    ├── neurologie.json                  # 450 questions, ~2.3MB
    ├── endocrinien.json                 # 400 questions, ~2MB
    ├── urinaire.json                    # 350 questions, ~1.8MB
    ├── digestif.json                    # 450 questions, ~2.3MB
    ├── anatomie_pathologique.json       # 500 questions, ~2.5MB
    ├── pharmacologie.json               # 700 questions, ~3.5MB
    ├── microbiologie.json               # 600 questions, ~3MB
    └── parasitologie.json               # 400 questions, ~2MB

Total: ~8,000 questions, ~40MB
```

---

## Implementation Plan

### Day 1: Supabase Setup & Database

**Duration**: 6 hours

#### Morning (3 hours)

1. **Create Supabase Project** (30 min)
   ```
   - Go to https://supabase.com
   - Sign up (free account)
   - Create new project
   - Note: Project URL, Anon Key, Service Role Key
   - Wait for project provisioning (~2 minutes)
   ```

2. **Setup Database Tables** (1.5 hours)
   ```sql
   -- Run all SQL scripts from Database Schema section
   - profiles
   - saved_questions
   - test_attempts
   - activation_keys
   - device_sessions
   - course_resources
   
   -- Enable Row Level Security policies
   -- Create indexes
   -- Create triggers
   ```

3. **Configure Authentication** (1 hour)
   ```
   - Enable email/password authentication
   - Configure email templates
   - Set up email confirmation (optional)
   - Configure password requirements
   - Test authentication in Supabase dashboard
   ```

#### Afternoon (3 hours)

4. **Create Storage Bucket** (30 min)
   ```
   - Create "questions" bucket
   - Make it public (read-only)
   - Configure CORS if needed
   - Test file upload
   ```

5. **Prepare JSON Files** (2 hours)
   ```
   - Create version.json
   - Create sample question files:
     * year1_anatomie.json (50 sample questions)
     * year2_cardio.json (50 sample questions)
   - Upload to Supabase Storage
   - Test download URLs
   ```

6. **Documentation** (30 min)
   ```
   - Document Supabase credentials
   - Document database schema
   - Document API endpoints
   - Create .env.example file
   ```

**Deliverables**:
- ✅ Supabase project created
- ✅ Database tables created
- ✅ Authentication configured
- ✅ Storage bucket ready
- ✅ Sample JSON files uploaded

---

### Day 2: Mobile App Setup & Services

**Duration**: 7 hours

#### Morning (4 hours)

1. **Install Dependencies** (30 min)
   ```bash
   cd mobile-app
   npm install @supabase/supabase-js
   npm install @react-native-async-storage/async-storage
   npm install react-hook-form
   npm install @react-navigation/native
   npm install @react-navigation/native-stack
   npm install @react-navigation/bottom-tabs
   ```

2. **Create Supabase Service** (1 hour)
   ```typescript
   // src/config/supabase.ts
   - Initialize Supabase client
   - Export configured client
   - Add TypeScript types
   
   // src/services/supabase.ts
   - Create service wrapper
   - Add error handling
   - Add retry logic
   ```

3. **Create Auth Service** (1.5 hours)
   ```typescript
   // src/services/auth.ts
   - signUp(email, password, userData)
   - signIn(email, password)
   - signOut()
   - getCurrentUser()
   - updateProfile(data)
   - changePassword(oldPassword, newPassword)
   - activateAccount(key)
   ```

4. **Create Auth Context** (1 hour)
   ```typescript
   // src/context/AuthContext.tsx
   - AuthProvider component
   - useAuth hook
   - State management (user, loading, error)
   - Token persistence
   ```

#### Afternoon (3 hours)

5. **Create Questions Service** (2 hours)
   ```typescript
   // src/services/questions.ts
   - loadQuestions(module)
   - checkForUpdates()
   - downloadModule(module)
   - filterQuestions(questions, filters)
   - searchQuestions(query)
   - getQuestionById(id)
   ```

6. **Create Other Services** (1 hour)
   ```typescript
   // src/services/savedQuestions.ts
   - saveQuestion(questionId)
   - unsaveQuestion(questionId)
   - getSavedQuestions()
   - isQuestionSaved(questionId)
   
   // src/services/testResults.ts
   - submitTestResult(data)
   - getTestHistory()
   - getUserStatistics()
   ```

**Deliverables**:
- ✅ All dependencies installed
- ✅ Supabase client configured
- ✅ Auth service complete
- ✅ Questions service complete
- ✅ Other services complete

---

### Day 3: Authentication Screens

**Duration**: 6 hours

#### Morning (3 hours)

1. **Update Login Screen** (1.5 hours)
   ```typescript
   // src/screens/auth/LoginScreen.tsx
   - Connect to real auth service
   - Add form validation
   - Add loading states
   - Add error handling
   - Add "Remember me" functionality
   - Test login flow
   ```

2. **Update Signup Screen** (1.5 hours)
   ```typescript
   // src/screens/auth/SignupScreen.tsx
   - Connect to real auth service
   - Add form validation
   - Add password strength indicator
   - Add terms & conditions
   - Add loading states
   - Add error handling
   - Test signup flow
   ```

#### Afternoon (3 hours)

3. **Create Profile Screen** (2 hours)
   ```typescript
   // src/screens/main/ProfileScreen.tsx
   - Display user profile
   - Edit profile form
   - Change password
   - View subscription status
   - View device sessions
   - Logout button
   ```

4. **Create Activation Screen** (1 hour)
   ```typescript
   // src/screens/main/ActivationScreen.tsx
   - Activation key input
   - Validate key
   - Activate account
   - Show success/error
   ```

**Deliverables**:
- ✅ Login screen working
- ✅ Signup screen working
- ✅ Profile screen working
- ✅ Activation screen working

---

### Day 4: Questions & Practice

**Duration**: 7 hours

#### Morning (4 hours)

1. **Update Home Screen** (1.5 hours)
   ```typescript
   // src/screens/main/HomeScreen.tsx
   - Load modules from JSON
   - Display module cards
   - Show question counts
   - Add search/filter
   - Handle loading states
   ```

2. **Create Practice Screen** (2.5 hours)
   ```typescript
   // src/screens/main/PracticeScreen.tsx
   - Load questions for selected module
   - Display question list
   - Add filters (year, exam type)
   - Implement pagination
   - Add pull-to-refresh
   - Handle empty states
   ```

#### Afternoon (3 hours)

3. **Create Question Detail Screen** (3 hours)
   ```typescript
   // src/screens/main/QuestionDetailScreen.tsx
   - Display question with answers
   - Implement answer selection
   - Submit answer
   - Show correct/incorrect
   - Show explanation
   - Add save button
   - Navigate next/previous
   - Track time spent
   ```

**Deliverables**:
- ✅ Home screen with modules
- ✅ Practice screen with questions
- ✅ Question detail with answers
- ✅ Answer submission working

---

### Day 5: Final Features & Testing

**Duration**: 8 hours

#### Morning (4 hours)

1. **Saved Questions Screen** (1.5 hours)
   ```typescript
   // src/screens/main/SavedQuestionsScreen.tsx
   - Load saved questions
   - Display question list
   - Add unsave button
   - Add practice button
   - Handle empty state
   ```

2. **Resources Screen** (1 hour)
   ```typescript
   // src/screens/main/ResourcesScreen.tsx
   - Load resources from Supabase
   - Display by category
   - Add filters
   - Open external links
   ```

3. **Test History & Analytics** (1.5 hours)
   ```typescript
   // src/screens/main/TestHistoryScreen.tsx
   - Load test history
   - Display test cards
   - Show score and date
   
   // src/screens/main/AnalyticsScreen.tsx
   - Load user statistics
   - Display overall accuracy
   - Display total questions
   - Display recent performance
   ```

#### Afternoon (4 hours)

4. **Testing** (2 hours)
   ```
   - Test all user flows
   - Test authentication
   - Test question loading
   - Test offline mode
   - Test answer submission
   - Test saved questions
   - Fix bugs
   ```

5. **Polish & Optimization** (2 hours)
   ```
   - Add loading indicators
   - Add error messages
   - Add empty states
   - Optimize performance
   - Add animations
   - Test on real device
   ```

**Deliverables**:
- ✅ All screens complete
- ✅ All features working
- ✅ App tested thoroughly
- ✅ Ready for deployment

---

## Features Breakdown


### Core Features (MVP)

#### 1. User Authentication

**Features**:
- Email/password registration
- Email/password login
- Password reset (email)
- Session persistence
- Auto-login on app restart
- Logout

**Implementation**:
```typescript
// Using Supabase Auth
const { data, error } = await supabase.auth.signUp({
  email: 'student@example.com',
  password: 'password123',
  options: {
    data: {
      username: 'student1',
      study_year: 2,
      speciality: 'Médecine'
    }
  }
});
```

**User Flow**:
```
1. User opens app
2. If not logged in → Show Login screen
3. User enters email/password
4. Click "Login"
5. Validate credentials
6. Store session
7. Navigate to Home screen
```

---

#### 2. Question Browsing

**Features**:
- Browse by study year (1/2/3)
- Browse by module
- Browse by exam type
- Filter questions
- Search questions
- View question count

**Implementation**:
```typescript
// Load questions from local JSON
const questions = await QuestionService.loadQuestions('year1_anatomie');

// Filter questions
const filtered = questions.filter(q => {
  if (filters.year && q.year !== filters.year) return false;
  if (filters.exam_type && q.exam_type !== filters.exam_type) return false;
  return true;
});
```

**User Flow**:
```
1. User opens Home screen
2. See modules (Anatomie, Biochimie, etc.)
3. Tap on module
4. See questions list
5. Apply filters (year, exam type)
6. Tap on question
7. View question detail
```

---

#### 3. Question Practice

**Features**:
- Display question with answers
- Select answer(s)
- Submit answer
- Show correct/incorrect
- Show explanation
- Navigate next/previous
- Track time spent
- Track correct/incorrect

**Implementation**:
```typescript
const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
const [submitted, setSubmitted] = useState(false);

const handleSubmit = () => {
  setSubmitted(true);
  
  // Check if correct
  const correctAnswers = question.answers
    .filter(a => a.is_correct)
    .map(a => a.label);
  
  const isCorrect = 
    selectedAnswers.length === correctAnswers.length &&
    selectedAnswers.every(a => correctAnswers.includes(a));
  
  // Track result
  trackAnswer(question.id, isCorrect);
};
```

**User Flow**:
```
1. User views question
2. Read question text
3. Select answer(s)
4. Click "Submit"
5. See if correct/incorrect
6. Read explanation
7. Click "Next" for next question
```

---

#### 4. Saved Questions

**Features**:
- Save question for later
- View all saved questions
- Unsave question
- Practice saved questions
- Filter saved questions

**Implementation**:
```typescript
// Save question
const saveQuestion = async (questionId: string) => {
  const { error } = await supabase
    .from('saved_questions')
    .insert({
      user_id: user.id,
      question_id: questionId
    });
  
  if (!error) {
    showToast('Question saved!');
  }
};

// Get saved questions
const getSavedQuestions = async () => {
  const { data } = await supabase
    .from('saved_questions')
    .select('question_id')
    .eq('user_id', user.id);
  
  // Load full questions from JSON
  const questionIds = data.map(d => d.question_id);
  const questions = await loadQuestionsByIds(questionIds);
  
  return questions;
};
```

**User Flow**:
```
1. User views question
2. Click heart icon to save
3. Question added to saved list
4. Navigate to "Saved Questions"
5. See all saved questions
6. Click to practice
7. Click heart again to unsave
```

---

#### 5. Test Results

**Features**:
- Submit test results
- View test history
- View statistics
- Track progress over time

**Implementation**:
```typescript
// Submit test result
const submitTestResult = async (data: TestData) => {
  const { error } = await supabase
    .from('test_attempts')
    .insert({
      user_id: user.id,
      module: data.module,
      study_year: data.study_year,
      questions_attempted: data.total,
      correct_count: data.correct,
      score_percentage: (data.correct / data.total) * 100,
      time_spent: data.timeSpent
    });
};

// Get statistics
const getStatistics = async () => {
  const { data } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('user_id', user.id);
  
  const totalQuestions = data.reduce((sum, t) => sum + t.questions_attempted, 0);
  const totalCorrect = data.reduce((sum, t) => sum + t.correct_count, 0);
  const averageScore = (totalCorrect / totalQuestions) * 100;
  
  return {
    totalQuestions,
    totalCorrect,
    averageScore,
    totalTests: data.length
  };
};
```

**User Flow**:
```
1. User completes practice session
2. App calculates score
3. Submit results to Supabase
4. Show results screen
5. Navigate to "Test History"
6. See all past tests
7. Navigate to "Analytics"
8. See overall statistics
```

---

#### 6. Course Resources

**Features**:
- View resources by category
- Filter by module/year
- Open external links
- Track resource access

**Implementation**:
```typescript
// Get resources
const getResources = async (filters?: ResourceFilters) => {
  let query = supabase
    .from('course_resources')
    .select('*');
  
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  
  if (filters?.module) {
    query = query.eq('module', filters.module);
  }
  
  const { data } = await query;
  return data;
};

// Open resource
const openResource = async (url: string) => {
  await Linking.openURL(url);
};
```

**User Flow**:
```
1. User navigates to "Resources"
2. See categories (Drive, Telegram, PDF)
3. Select category
4. See resources list
5. Tap on resource
6. Opens in external app/browser
```

---

#### 7. Subscription Management

**Features**:
- Activate account with key
- View subscription status
- View expiry date
- Renewal reminder

**Implementation**:
```typescript
// Activate account
const activateAccount = async (key: string) => {
  // Check if key is valid
  const { data: keyData } = await supabase
    .from('activation_keys')
    .select('*')
    .eq('key', key)
    .eq('is_used', false)
    .single();
  
  if (!keyData) {
    throw new Error('Invalid or already used key');
  }
  
  // Mark key as used
  await supabase
    .from('activation_keys')
    .update({
      is_used: true,
      used_by: user.id,
      used_at: new Date().toISOString()
    })
    .eq('id', keyData.id);
  
  // Update user profile
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  
  await supabase
    .from('profiles')
    .update({
      is_paid: true,
      payment_expiry: expiryDate.toISOString()
    })
    .eq('id', user.id);
  
  return { success: true, expiryDate };
};
```

**User Flow**:
```
1. User purchases activation key
2. Opens app
3. Navigates to "Activate Account"
4. Enters activation key
5. Click "Activate"
6. Account activated
7. Can now access all questions
```

---

#### 8. Device Management

**Features**:
- Register device
- View active devices
- Deactivate device
- Max 2 devices per user

**Implementation**:
```typescript
// Register device
const registerDevice = async () => {
  const deviceId = await getDeviceId();
  const deviceName = await getDeviceName();
  
  const { error } = await supabase
    .from('device_sessions')
    .upsert({
      user_id: user.id,
      device_fingerprint: deviceId,
      device_name: deviceName,
      last_seen: new Date().toISOString()
    });
  
  // Trigger will automatically remove oldest device if > 2
};

// Get active devices
const getDevices = async () => {
  const { data } = await supabase
    .from('device_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('last_seen', { ascending: false });
  
  return data;
};
```

**User Flow**:
```
1. User logs in on new device
2. Device automatically registered
3. If 3rd device, oldest is removed
4. Navigate to "Profile" → "Devices"
5. See active devices
6. Can manually deactivate device
```

---

#### 9. Offline Support

**Features**:
- Questions available offline
- Queue operations when offline
- Sync when online
- Show offline indicator

**Implementation**:
```typescript
// Check if online
const [isOnline, setIsOnline] = useState(true);

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    setIsOnline(state.isConnected);
  });
  
  return () => unsubscribe();
}, []);

// Queue operation if offline
const saveQuestionOffline = async (questionId: string) => {
  if (!isOnline) {
    // Queue for later
    await AsyncStorage.setItem(
      `pending_save_${questionId}`,
      JSON.stringify({ questionId, timestamp: Date.now() })
    );
    showToast('Will save when online');
    return;
  }
  
  // Save immediately
  await saveQuestion(questionId);
};

// Sync when online
useEffect(() => {
  if (isOnline) {
    syncPendingOperations();
  }
}, [isOnline]);
```

**User Flow**:
```
1. User loses internet connection
2. App shows "Offline" indicator
3. User can still browse questions
4. User saves question
5. Operation queued
6. Internet reconnects
7. App syncs automatically
8. Saved question appears in list
```

---

#### 10. JSON Updates

**Features**:
- Check for updates on launch
- Download new questions
- Update in background
- Show update progress

**Implementation**:
```typescript
// Check for updates
const checkForUpdates = async () => {
  // Get local version
  const localVersion = await AsyncStorage.getItem('questions_version');
  
  // Get remote version
  const { data } = await supabase.storage
    .from('questions')
    .download('version.json');
  
  const remoteVersion = JSON.parse(await data.text());
  
  if (remoteVersion.version > localVersion) {
    // Download updates
    for (const [module, info] of Object.entries(remoteVersion.modules)) {
      const localModuleVersion = await AsyncStorage.getItem(`${module}_version`);
      
      if (info.version > localModuleVersion) {
        await downloadModule(module);
      }
    }
    
    // Update version
    await AsyncStorage.setItem('questions_version', remoteVersion.version);
    
    showToast('Questions updated!');
  }
};

// Download module
const downloadModule = async (module: string) => {
  const { data } = await supabase.storage
    .from('questions')
    .download(`${module}.json`);
  
  const questions = JSON.parse(await data.text());
  
  // Save locally
  await AsyncStorage.setItem(module, JSON.stringify(questions));
  await AsyncStorage.setItem(`${module}_version`, questions.version);
};
```

**User Flow**:
```
1. User opens app
2. App checks for updates
3. New questions available
4. Downloads in background
5. Shows "Updating questions..."
6. Update complete
7. User sees new questions
```

---

## Cost Analysis

### Supabase Pricing

#### Free Tier (Perfect for Launch)

```
Limits:
├─ 50,000 monthly active users
├─ 500MB database storage
├─ 1GB file storage
├─ 2GB bandwidth per month
├─ 50,000 monthly email sends
└─ Unlimited API requests

Cost: $0/month

Suitable for:
✅ First 50,000 users
✅ ~8,000 questions (~40MB)
✅ Development and testing
✅ MVP launch
```

#### Pro Tier (When You Grow)

```
Limits:
├─ 100,000 monthly active users
├─ 8GB database storage
├─ 100GB file storage
├─ 50GB bandwidth per month
├─ 100,000 monthly email sends
└─ Unlimited API requests

Cost: $25/month

Suitable for:
✅ 50,000-100,000 users
✅ Larger question database
✅ More resources
✅ Production scale
```

### Cost Comparison

```
Architecture Comparison (Monthly):

FastAPI + PostgreSQL:
├─ DigitalOcean Droplet: $6
├─ PostgreSQL: Included
├─ Domain: $1
└─ Total: $7/month ($84/year)

Supabase + JSON:
├─ Supabase Free: $0 (up to 50K users)
├─ Domain: $1
└─ Total: $1/month ($12/year)

Savings: $72/year initially

At 50,000+ users:
├─ Supabase Pro: $25/month
├─ Domain: $1/month
└─ Total: $26/month ($312/year)

But at 50,000 users:
- Even 1% paid = 500 users
- 500 × $15 = $7,500/year revenue
- $312/year cost
- Net: $7,188/year profit
```

### Revenue Projections

```
Conservative Scenario (1% conversion):
├─ 10,000 users → 100 paid → $1,500/year
├─ 50,000 users → 500 paid → $7,500/year
└─ 100,000 users → 1,000 paid → $15,000/year

Moderate Scenario (5% conversion):
├─ 10,000 users → 500 paid → $7,500/year
├─ 50,000 users → 2,500 paid → $37,500/year
└─ 100,000 users → 5,000 paid → $75,000/year

Optimistic Scenario (10% conversion):
├─ 10,000 users → 1,000 paid → $15,000/year
├─ 50,000 users → 5,000 paid → $75,000/year
└─ 100,000 users → 10,000 paid → $150,000/year

Infrastructure costs are negligible compared to revenue!
```

---

## Scalability Plan

### Phase 1: Launch (0-10,000 users)

```
Infrastructure:
├─ Supabase Free Tier
├─ Questions: ~40MB (8,000 questions)
├─ Bandwidth: <2GB/month
└─ Cost: $0/month

Capacity:
├─ Can handle 50,000 users
├─ Room for 5x growth
└─ No infrastructure changes needed
```

### Phase 2: Growth (10,000-50,000 users)

```
Infrastructure:
├─ Still Supabase Free Tier
├─ Questions: ~60MB (12,000 questions)
├─ Bandwidth: ~2GB/month (at limit)
└─ Cost: $0/month

Optimizations:
├─ Implement CDN for JSON files
├─ Optimize JSON file sizes
├─ Add caching layer
└─ Monitor bandwidth usage
```

### Phase 3: Scale (50,000-100,000 users)

```
Infrastructure:
├─ Upgrade to Supabase Pro
├─ Questions: ~100MB (20,000 questions)
├─ Bandwidth: ~10GB/month
└─ Cost: $25/month

Optimizations:
├─ Use Cloudflare CDN
├─ Implement delta updates
├─ Add Redis caching
└─ Optimize database queries
```

### Phase 4: Enterprise (100,000+ users)

```
Infrastructure:
├─ Supabase Pro or Custom
├─ Questions: ~200MB (40,000 questions)
├─ Bandwidth: ~50GB/month
├─ CDN: Cloudflare
└─ Cost: $50-100/month

Optimizations:
├─ Database read replicas
├─ Multi-region deployment
├─ Advanced caching
└─ Load balancing
```

---

## Deployment Strategy


### Mobile App Deployment

#### Android (Google Play Store)

**Prerequisites**:
- Google Play Developer account ($25 one-time)
- App signing key
- App assets (icon, screenshots, description)

**Steps**:

1. **Prepare App** (1 hour)
   ```bash
   # Update app.json
   {
     "expo": {
       "name": "MedExam Pro",
       "slug": "medexam-pro",
       "version": "1.0.0",
       "android": {
         "package": "com.medexam.pro",
         "versionCode": 1,
         "permissions": ["INTERNET", "ACCESS_NETWORK_STATE"]
       }
     }
   }
   
   # Update API URL to production
   const SUPABASE_URL = 'https://your-project.supabase.co';
   ```

2. **Build APK/AAB** (30 min)
   ```bash
   # Install EAS CLI
   npm install -g eas-cli
   
   # Login to Expo
   eas login
   
   # Configure build
   eas build:configure
   
   # Build for Android
   eas build --platform android --profile production
   
   # Download AAB file
   # Wait ~10-20 minutes for build
   ```

3. **Create Play Store Listing** (2 hours)
   ```
   - Go to Google Play Console
   - Create new app
   - Fill app details:
     * Title: MedExam Pro
     * Short description (80 chars)
     * Full description (4000 chars)
     * Category: Education
     * Content rating: Everyone
   
   - Upload assets:
     * App icon (512x512)
     * Feature graphic (1024x500)
     * Screenshots (at least 2)
     * Phone screenshots (1080x1920)
     * Tablet screenshots (optional)
   
   - Set pricing: Free
   - Set countries: Algeria + others
   ```

4. **Upload AAB** (30 min)
   ```
   - Go to "Production" → "Create new release"
   - Upload AAB file
   - Fill release notes
   - Review and rollout
   ```

5. **Submit for Review** (5 min)
   ```
   - Review all information
   - Submit for review
   - Wait 1-3 days for approval
   ```

**Timeline**: 4-5 hours + 1-3 days review

---

#### iOS (Apple App Store)

**Prerequisites**:
- Apple Developer account ($99/year)
- Mac computer with Xcode
- App Store Connect access

**Steps**:

1. **Prepare App** (1 hour)
   ```bash
   # Update app.json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.medexam.pro",
         "buildNumber": "1.0.0",
         "supportsTablet": true
       }
     }
   }
   ```

2. **Build IPA** (30 min)
   ```bash
   # Build for iOS
   eas build --platform ios --profile production
   
   # Download IPA file
   # Wait ~15-30 minutes for build
   ```

3. **Create App Store Listing** (2 hours)
   ```
   - Go to App Store Connect
   - Create new app
   - Fill app information
   - Upload screenshots
   - Set pricing and availability
   ```

4. **Upload IPA** (30 min)
   ```
   - Use Transporter app
   - Upload IPA file
   - Wait for processing
   ```

5. **Submit for Review** (5 min)
   ```
   - Fill review information
   - Submit for review
   - Wait 1-7 days for approval
   ```

**Timeline**: 4-5 hours + 1-7 days review

---

### Supabase Deployment

**Already Deployed!**
- Supabase is a managed service
- No deployment needed
- Just configure and use
- Automatic scaling
- Automatic backups

**Production Checklist**:
```
✅ Enable email confirmation
✅ Configure email templates
✅ Set up custom domain (optional)
✅ Enable database backups
✅ Configure CORS settings
✅ Set up monitoring
✅ Enable rate limiting
✅ Review security policies
```

---

### JSON Files Deployment

**Supabase Storage**:
```bash
# Upload JSON files
1. Go to Supabase Dashboard
2. Navigate to Storage
3. Select "questions" bucket
4. Upload files:
   - version.json
   - year1/anatomie.json
   - year2/cardio.json
   - etc.

# Or use CLI
supabase storage upload questions version.json
supabase storage upload questions/year1 anatomie.json
```

**Update Process**:
```
1. Admin adds new questions
2. Export to JSON
3. Upload to Supabase Storage
4. Update version.json
5. Users get update on next app launch
6. No app store approval needed!
```

---

### Domain Setup (Optional)

**Custom Domain for Supabase**:
```
1. Purchase domain (e.g., medexam.dz)
2. Go to Supabase Dashboard → Settings → Custom Domains
3. Add custom domain
4. Update DNS records
5. Wait for SSL certificate
6. Update app configuration
```

**Cost**: $10-15/year

---

## Success Metrics

### Launch Goals (First 3 Months)

```
User Acquisition:
├─ 500+ registered users
├─ 100+ paid subscriptions
├─ 20% conversion rate
└─ 50% retention rate

Engagement:
├─ 10,000+ questions attempted
├─ 30% daily active users
├─ 15 minutes average session time
├─ 20+ questions per session
└─ 70% return rate

Technical:
├─ 99% uptime
├─ <100ms API response time
├─ <5% crash rate
├─ 4.0+ app store rating
└─ <1% error rate

Revenue:
├─ 100 paid users × $15 = $1,500
├─ Cost: $0 (free tier)
└─ Net: $1,500 profit
```

### Growth Goals (6 Months)

```
User Acquisition:
├─ 5,000+ registered users
├─ 500+ paid subscriptions
├─ 10% conversion rate
└─ 60% retention rate

Engagement:
├─ 100,000+ questions attempted
├─ 40% daily active users
├─ 20 minutes average session time
├─ 30+ questions per session
└─ 75% return rate

Revenue:
├─ 500 paid users × $15 = $7,500
├─ Cost: $0 (still free tier)
└─ Net: $7,500 profit
```

### Scale Goals (1 Year)

```
User Acquisition:
├─ 50,000+ registered users
├─ 5,000+ paid subscriptions
├─ 10% conversion rate
└─ 70% retention rate

Engagement:
├─ 1,000,000+ questions attempted
├─ 50% daily active users
├─ 25 minutes average session time
├─ 40+ questions per session
└─ 80% return rate

Revenue:
├─ 5,000 paid users × $15 = $75,000
├─ Cost: $300 (Supabase Pro)
└─ Net: $74,700 profit
```

---

## Risk Management

### Technical Risks

#### Risk 1: Supabase Downtime

```
Risk: Supabase service goes down
Impact: Users can't login or sync data
Probability: Low (99.9% uptime SLA)

Mitigation:
✅ Offline-first architecture (questions work offline)
✅ Queue operations when offline
✅ Retry logic with exponential backoff
✅ Show clear error messages
✅ Monitor Supabase status page

Contingency:
- Questions still work offline
- Users can practice without login
- Sync when service recovers
```

#### Risk 2: Large JSON Files

```
Risk: JSON files become too large (>50MB)
Impact: Slow
on: 1.0*
4*
*Versiuary 202: Jant updated

*Las this! 🚀**ildet's bu---

**Lues

 issobiler ms foe Expo forume docs
- Useact Nativto Rr 
- Refentationbase documeck Supa
- Checs` folderdo`/n in entatioocum Review dntation:
-lemet during imporor suppstions 

For quertact & Suppo

### Cont (Ongoing)d iterate***Launch an
6. *)k 2es** (Weeo app storeploy t
5. **D* (Day 5)ughly***Test thoro
4. y 2)ent** (Davelopmbile app demo. **Start ay 1)
3(Droject** ase ppabSu
2. **Setup ✅s roadmap** thi. **Review t Steps

1# Nex

##g buildinommunity6. Strong cxperience
nt user e
5. Excellesupdatent egular conteture
4. Rtechiarcirst . Offline-f
3Supabase)ervices (ged se manaag
2. Leverlyeatures oncus on MVP fFotors**:
1. Success Fac

**end server)ck (no baitecturerchimpler a S
- approval)no app storedates (t content up Instan default
- by supportoffline
- Full s) vs 120-350m (10-30msn loadingtioter ques fasially
- 10xvings initst saar co72-144/ye)
- $days10-12 5 days vs nt (meevelopster d
- 50% faenefits**:

**Key Bers)00 uso 50,0up ting cost ( $0 hostimeline
- ✅elopment t 5-day devirst)
- ✅-f (offlineons for questiilesSON f- ✅ J data
sercation and uuthentise for aabapp
- ✅ Sup alexpo for mobie + Eact NativReons**:
- ✅ y DecisiKe
**tecture:
ective archiff-e costn,ering a modApp usQ Study ching the MCaung and linbuildor  strategy fompletea cs outlineap roadmary

This # Summn

##ioclus
## Con--
te
```

- raetention re
└─ 80%sion rater├─ 10% conv
 paid userss
├─ 5,000+ser─ 50,000+ u:
├Metrics

ity supporterslti-univion
└─ Mueb app verses
├─ Waturcial fe─ Sods)
├oarleaderbges, n (badificatio├─ Gam
egrationateway intPayment g
├─ age supportlanguabic ├─ Ar
Tasks:
 expansion
: Scaling,``
Focus12)

`Months 7- Scale (se 4:Pha`

### 
``on rate80% retentin rate
└─ ersio
├─ 15% convsser paid u─ 2,000+ers
├ 20,000+ usMetrics:
├─ation

imizoptrmance 
└─ Perfotionality Search func
├─mode
├─ Dark nsotificatio ns
├─ Pushced analytic─ Advan
├y timerks:
├─ Studason

Tptimizatiatures, os: New fe`
Focu4-6)

``onths (Mment ancee 3: Enhhas
### P
```
rateon 5% retentirate
└─ 7sion 0% conver─ 1
├ usersaid0+ pusers
├─ 50
├─ 5,000+ Metrics:

smprovement└─ Feature ites
ntent updam
├─ Coprograeferral s
├─ Rtnership parniversity Uence
├─ media presocial├─ S
campaignsing ├─ Marketks:
Tasent

gagem enn, acquisitio
Focus: User
```ths 2-3)
th (Monrowhase 2: G``

### P
` ratetention 70% reting
└─+ app rase
├─ 4.0espon100ms API rte
├─ <sh ra─ <2% cra:
├tricsdback

Meer feeuspond to es
└─ Resatur missing fe
├─ Adddlingor hane err─ Improv
├anceorme perfmiz─ Optical bugs
├ Fix critieports
├─tor crash rMoniks:
├─ ty

Tase stabiligs, improvus: Fix bu`
Foc
``-4)
Weeks 1lization (e 1: Stabi Phas##oadmap

#st-Launch R-

## Po
--tes
```
pda
- Faster uualityontent qBetter cricing
- tive petiCompfeatures
- ique ate with unferentiDif- ntingency:
alty

Coloy
✅ Brand ingunity build
✅ Commr updateslaence
✅ Reguser experierior u Supge
✅over advantat-mion:
✅ Firsatig
Mit High
obability:
Pr losset shareImpact: Markr app
imilah sors launck: Competit`
Ris
``etition
Compk 3: 
#### Ris
nts
```ouenewal discfer r Ofe
-perienc user exmprovees
- I featuruested
- Add reqkbacrs for feed- Survey use:
ontingency

Ctnt suppor
✅ Excelle featuresommunity
✅ Cesaturtion feicaons
✅ Gamifificati notagement
✅ Engtest updaencontgular :
✅ Reionm

Mitigat Mediulity:obabiPrss
ue lovent: ReImpaciption
ew subscrn't rensers do
Risk: U
```Rate
 Churn sk 2: High

#### Ri
```sscountr diting
- Offerove markes
- ImpureatAdd more feng
- ust prici:
- Adjcyingen

Contadorssst ambadenStu
✅ partnershipssity g
✅ Univer marketinediaocial mgram
✅ S proral
✅ Referperiodal riee tion:
✅ Frigatm

Mit Mediuity:babilvenue
Prot: Low re up
Impacgnrs si uset enough No``
Risk:doption

`Low User A 1: sk Ri####ks

Business Ris# 
```

##testingor iOS Flight fe Testubmit
- Us resnd issues a)
- Fixroidtly (Ande APK direc- Distributncy:
ontingeeedback

Co review fckly td quiponRes✅ cy
cy polir privavide clea
✅ Proubmissionhly before s thorougTest✅ elines
uidre gstoFollow app gation:
✅ Mities)

ng guidelin (followiability: LowProbch
d launye: DelaactApple
Imp by Google/p rejectedisk: Ap`
Rction

``re Reje StoAppk 3: ## Ris```

##raphQL
 Gate toigr
- Mestionsse for quse databaination
- Uag Implement ptingency:
-ads

Connlodow faster ✅ CDN for)
ession (gzippr)
✅ Comuestions changed qtes (onlyta upda)
✅ Delmandad on deing (downloazy load)
✅ Ldonele (already  by modu Splitation:
✅)

Mitiggrowstions (as que Medium ty:
Probabilithbandwidoads, high  downl