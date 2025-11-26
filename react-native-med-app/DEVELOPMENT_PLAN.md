# 📱 MCQ Study App - Mobile Development Plan

**Project**: Medical Exam Preparation Platform for Algerian Students  
**Platform**: React Native + Expo + Supabase  
**Timeline**: 14 Days  
**Status**: Ready to Start

---

## 🎯 Overview

Build a mobile app for Algerian medical students to practice MCQ questions based on the French medical curriculum. The database and admin interface are ready - now we build the student-facing mobile app.

### What's Already Done ✅
- Supabase database schema (users, modules, questions, answers, etc.)
- 26 predefined modules (1st, 2nd, 3rd year)
- Admin interface (db-interface) for managing questions/resources
- TypeScript types (supabase/types.ts)
- RLS policies for security

### What We're Building 🚀
- Student mobile app (iOS + Android)
- Authentication with activation codes
- Module browsing by year
- QCM practice with immediate feedback
- Saved questions & statistics
- Course resources access

---

## 👤 User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        APP LAUNCH                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Check Session  │
                    └─────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
     ┌─────────────────┐             ┌─────────────────┐
     │   No Session    │             │  Has Session    │
     │   (Auth Flow)   │             │  (Main App)     │
     └─────────────────┘             └─────────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AUTH FLOW                                   │
├─────────────────────────────────────────────────────────────────┤
│  1. Welcome Screen                                               │
│     └─> Login / Register buttons                                │
│                                                                  │
│  2. Register Screen                                              │
│     ├─> Full Name                                               │
│     ├─> Email                                                   │
│     ├─> Password                                                │
│     ├─> Speciality (Médecine, Pharmacie, Dentaire)             │
│     ├─> Year of Study (1, 2, 3)                                │
│     ├─> Region (Wilaya)                                        │
│     └─> Activation Code                                         │
│                                                                  │
│  3. Login Screen                                                 │
│     ├─> Email                                                   │
│     └─> Password                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MAIN APP (Tabs)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │   🏠     │    │   📚     │    │   👤     │                  │
│  │  Home    │    │Resources │    │ Profile  │                  │
│  └──────────┘    └──────────┘    └──────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      HOME SCREEN                                 │
├─────────────────────────────────────────────────────────────────┤
│  • Welcome message with user name                               │
│  • Quick stats (questions done, accuracy)                       │
│  • Module cards for user's year                                 │
│  • Each card shows: name, type, question count                  │
│  • Tap module → Module Detail                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MODULE DETAIL SCREEN                          │
├─────────────────────────────────────────────────────────────────┤
│  • Module name and type badge                                   │
│  • Total questions available                                    │
│  • User's progress (% completed)                                │
│                                                                  │
│  Practice Options:                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📝 Exam QCM (Mixed)                                     │   │
│  │  Practice all questions from exams                       │   │
│  │  Select: EMD / EMD1 / EMD2 / Rattrapage / M1-M4         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📖 Single Cours                                         │   │
│  │  Practice questions from specific topic                  │   │
│  │  Select: [List of cours available]                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  For U.E.I modules:                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🔬 Sub-discipline                                       │   │
│  │  Select: Anatomie / Histologie / Physiologie / etc.     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    QCM PRACTICE SCREEN                           │
├─────────────────────────────────────────────────────────────────┤
│  Header: Module name | Question X/Y | ⏱️ Timer                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Question Text                                           │   │
│  │  (May include image)                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ○ A. Answer option A                                    │   │
│  │  ○ B. Answer option B                                    │   │
│  │  ○ C. Answer option C                                    │   │
│  │  ○ D. Answer option D                                    │   │
│  │  ○ E. Answer option E                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [💾 Save] [Submit Answer] [Skip →]                             │
│                                                                  │
│  After Submit:                                                   │
│  • Correct answers highlighted in green                         │
│  • Wrong answers highlighted in red                             │
│  • [Next Question →]                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RESULTS SCREEN                                │
├─────────────────────────────────────────────────────────────────┤
│  • Score: X/Y (percentage)                                      │
│  • Time spent                                                   │
│  • Correct/Incorrect breakdown                                  │
│  • [Review Answers] [Practice Again] [Back to Home]            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
react-native-med-app/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/                   # Auth group (unauthenticated)
│   │   ├── _layout.tsx           # Auth layout
│   │   ├── welcome.tsx           # Welcome/landing screen
│   │   ├── login.tsx             # Login screen
│   │   ├── register.tsx          # Registration screen
│   │   └── forgot-password.tsx   # Password reset
│   │
│   ├── (tabs)/                   # Main app tabs (authenticated)
│   │   ├── _layout.tsx           # Tab layout with bottom nav
│   │   ├── index.tsx             # Home screen (modules)
│   │   ├── resources.tsx         # Resources screen
│   │   └── profile.tsx           # Profile screen
│   │
│   ├── module/                   # Module screens
│   │   └── [id].tsx              # Module detail screen
│   │
│   ├── practice/                 # Practice screens
│   │   ├── [moduleId].tsx        # QCM practice session
│   │   └── results.tsx           # Results screen
│   │
│   ├── saved/                    # Saved questions
│   │   └── index.tsx             # Saved questions list
│   │
│   ├── _layout.tsx               # Root layout
│   └── index.tsx                 # Entry point (redirect)
│
├── src/
│   ├── components/               # Reusable components
│   │   ├── ui/                   # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Progress.tsx
│   │   │   └── Select.tsx
│   │   ├── ModuleCard.tsx        # Module display card
│   │   ├── QuestionCard.tsx      # Question display
│   │   ├── AnswerOption.tsx      # Answer option button
│   │   ├── ResourceCard.tsx      # Resource link card
│   │   └── StatCard.tsx          # Statistics card
│   │
│   ├── context/                  # React Context providers
│   │   ├── AuthContext.tsx       # Authentication state
│   │   └── PracticeContext.tsx   # Practice session state
│   │
│   ├── lib/                      # Services & utilities
│   │   ├── supabase.ts           # Supabase client
│   │   ├── auth.ts               # Auth service
│   │   ├── modules.ts            # Modules service
│   │   ├── questions.ts          # Questions service
│   │   ├── saved.ts              # Saved questions service
│   │   ├── stats.ts              # Statistics service
│   │   ├── resources.ts          # Resources service
│   │   └── storage.ts            # AsyncStorage helpers
│   │
│   ├── types/                    # TypeScript types
│   │   └── index.ts              # All types (copy from supabase/types.ts)
│   │
│   ├── constants/                # App constants
│   │   ├── modules.ts            # Predefined modules
│   │   ├── regions.ts            # Algerian wilayas
│   │   └── theme.ts              # Colors, fonts, etc.
│   │
│   └── hooks/                    # Custom hooks
│       ├── useAuth.ts            # Auth hook
│       ├── useModules.ts         # Modules hook
│       └── useQuestions.ts       # Questions hook
│
├── assets/                       # Static assets
│   ├── images/                   # App images
│   ├── icons/                    # Custom icons
│   └── fonts/                    # Custom fonts (optional)
│
├── app.json                      # Expo configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.js            # NativeWind config
├── babel.config.js               # Babel config
└── .env                          # Environment variables
```

---

## 🗓️ Development Phases

### Phase 1: Project Setup (Day 1)
**Goal**: Initialize project with all dependencies and configurations

**Tasks**:
1. Initialize Expo project with TypeScript template
2. Install dependencies:
   - `@supabase/supabase-js` - Supabase client
   - `@react-native-async-storage/async-storage` - Local storage
   - `expo-router` - File-based routing
   - `nativewind` - Tailwind CSS for React Native
   - `react-hook-form` - Form handling
   - `zod` - Validation
   - `expo-secure-store` - Secure token storage
   - `expo-device` - Device info
   - `expo-linking` - Deep linking
3. Configure Supabase client
4. Copy types from `supabase/types.ts`
5. Create constants (modules, regions, theme)
6. Setup folder structure

**Deliverables**:
- ✅ Project initialized and running
- ✅ All dependencies installed
- ✅ Supabase connected
- ✅ Types and constants ready

---

### Phase 2: Authentication (Days 2-3)
**Goal**: Complete auth flow with registration, login, and activation

**Tasks**:
1. Create AuthContext for state management
2. Build Welcome screen (landing page)
3. Build Registration screen:
   - Full name input
   - Email input
   - Password input (with confirmation)
   - Speciality dropdown (Médecine, Pharmacie, Dentaire)
   - Year of study dropdown (1, 2, 3)
   - Region dropdown (48 wilayas)
   - Activation code input
4. Build Login screen
5. Build Forgot Password screen
6. Implement auth services:
   - `signUp()` - Register new user
   - `signIn()` - Login user
   - `signOut()` - Logout user
   - `activateSubscription()` - Validate activation code
   - `resetPassword()` - Send reset email
7. Device session management (max 2 devices)
8. Token persistence with SecureStore

**Deliverables**:
- ✅ Users can register with all required fields
- ✅ Activation code validates subscription
- ✅ Users can login/logout
- ✅ Session persists across app restarts

---

### Phase 3: Navigation & Layout (Day 4)
**Goal**: Setup app navigation structure

**Tasks**:
1. Configure Expo Router layouts
2. Create auth layout (unauthenticated screens)
3. Create tabs layout (authenticated screens)
4. Build bottom tab bar with icons:
   - 🏠 Home
   - 📚 Resources
   - 👤 Profile
5. Create header component
6. Setup navigation guards (redirect if not authenticated)
7. Add loading states and splash screen

**Deliverables**:
- ✅ Navigation working between all screens
- ✅ Tab bar with proper icons
- ✅ Auth guards protecting main app

---

### Phase 4: Home & Modules (Days 5-6)
**Goal**: Display modules and allow selection

**Tasks**:
1. Build Home screen:
   - Welcome message with user name
   - Quick stats cards (questions done, accuracy)
   - Module list for user's year
2. Create ModuleCard component:
   - Module name
   - Type badge (Annual, Semestrial, U.E.I, Standalone)
   - Question count
   - Progress indicator
3. Build Module Detail screen:
   - Module info header
   - Practice mode selection:
     - Exam QCM (select exam type)
     - Single Cours (select specific cours)
   - For U.E.I: Sub-discipline selection
4. Implement modules service:
   - `getModulesByYear()` - Fetch modules for year
   - `getModuleById()` - Fetch single module
   - `getQuestionCount()` - Count questions per module

**Deliverables**:
- ✅ Home shows modules for user's year
- ✅ Module cards display correctly
- ✅ Module detail shows practice options

---

### Phase 5: QCM Practice (Days 7-9)
**Goal**: Core practice functionality

**Tasks**:
1. Build Practice screen:
   - Question display with number
   - Answer options (A-E)
   - Submit button
   - Navigation (next/previous)
   - Progress indicator
   - Timer (optional)
   - Save question button
2. Create AnswerOption component:
   - Selectable state
   - Correct/incorrect highlighting
   - Multiple selection support
3. Build Results screen:
   - Score display (X/Y, percentage)
   - Time spent
   - Correct/incorrect breakdown
   - Review answers option
   - Practice again button
4. Implement questions service:
   - `getQuestions()` - Fetch questions with filters
   - `getQuestionsByExam()` - Questions by exam type
   - `getQuestionsByCours()` - Questions by cours
5. Implement practice logic:
   - Track answers
   - Calculate score
   - Save test attempt to database
6. Create PracticeContext for session state

**Deliverables**:
- ✅ Users can practice questions
- ✅ Immediate feedback on answers
- ✅ Results saved to database
- ✅ Score and stats displayed

---

### Phase 6: Profile & Statistics (Day 10)
**Goal**: User profile and progress tracking

**Tasks**:
1. Build Profile screen:
   - User info display (name, email, year, speciality)
   - Edit profile button
   - Subscription status
   - Saved questions shortcut
   - Statistics section
   - Logout button
2. Build Edit Profile screen
3. Build Saved Questions screen:
   - List of saved questions
   - Filter by module
   - Remove from saved
   - Practice saved questions
4. Create statistics display:
   - Overall accuracy
   - Questions attempted
   - Time spent studying
   - Progress per module
5. Implement services:
   - `getUserStats()` - Fetch user statistics
   - `getModuleStats()` - Stats per module
   - `getSavedQuestions()` - Fetch saved questions
   - `saveQuestion()` / `unsaveQuestion()`

**Deliverables**:
- ✅ Profile displays user info
- ✅ Statistics show progress
- ✅ Saved questions accessible

---

### Phase 7: Resources (Day 11)
**Goal**: Course resources access

**Tasks**:
1. Build Resources screen:
   - Filter by year
   - Filter by module
   - Filter by type (Drive, Telegram, etc.)
2. Create ResourceCard component:
   - Title and description
   - Type icon
   - Module badge
   - Open link button
3. Implement resources service:
   - `getResources()` - Fetch with filters
4. Handle external links:
   - Open in browser/app
   - Deep linking for Telegram, Drive

**Deliverables**:
- ✅ Resources displayed by category
- ✅ Filters working
- ✅ Links open correctly

---

### Phase 8: Polish & Testing (Days 12-14)
**Goal**: Quality assurance and final touches

**Tasks**:
1. Error handling:
   - Network errors
   - Auth errors
   - Empty states
2. Loading states:
   - Skeleton loaders
   - Pull to refresh
3. Offline handling:
   - Show offline message
   - Cache critical data
4. Performance optimization:
   - Lazy loading
   - Image optimization
   - List virtualization
5. UI polish:
   - Animations
   - Transitions
   - Consistent styling
6. Testing:
   - Test on real devices
   - Test all user flows
   - Fix bugs
7. App store preparation:
   - App icon
   - Splash screen
   - Screenshots
   - Description

**Deliverables**:
- ✅ App runs smoothly
- ✅ All edge cases handled
- ✅ Ready for app store

---

## 🎁 Bonus Features (If Time Permits)

### 1. Dark Mode 🌙
- Toggle in profile
- System preference detection
- Consistent dark theme

### 2. Quick Practice ⚡
- Random questions from all modules
- Quick 10-question sessions
- Great for revision

### 3. Streak Counter 🔥
- Track daily practice
- Motivate consistent study
- Display on home screen

### 4. Daily Goal 🎯
- Set daily question target
- Progress bar
- Celebration on completion

### 5. Practice History 📊
- View past sessions
- See improvement over time
- Detailed analytics

### 6. Exam Simulation 📝
- Timed practice
- Exam conditions
- No going back

### 7. Question Notes 📝
- Add personal notes to saved questions
- Review notes later
- Better retention

### 8. Share Progress 📤
- Share stats on social media
- Invite friends
- Leaderboard (future)

---

## 🗄️ Database Schema Reference

### Tables Used by Mobile App

```sql
-- Users (extended from auth.users)
users (
  id, email, full_name, role, is_paid, 
  subscription_expires_at, created_at, updated_at
)

-- Modules (predefined, read-only)
modules (
  id, name, year, type, exam_types, 
  has_sub_disciplines, sub_disciplines
)

-- Questions
questions (
  id, year, module_name, sub_discipline, exam_type,
  number, question_text, speciality, cours, 
  unity_name, module_type, created_at
)

-- Answers
answers (
  id, question_id, option_label, answer_text,
  is_correct, display_order
)

-- Saved Questions
saved_questions (
  id, user_id, question_id, created_at
)

-- Test Attempts
test_attempts (
  id, user_id, year, module_name, sub_discipline,
  exam_type, total_questions, correct_answers,
  score_percentage, time_spent_seconds, completed_at
)

-- Course Resources
course_resources (
  id, year, module_name, sub_discipline,
  title, type, url, description
)

-- Activation Keys
activation_keys (
  id, key_code, duration_days, is_used,
  used_by, used_at, created_by
)

-- Device Sessions
device_sessions (
  id, user_id, device_id, device_name,
  last_active_at, created_at
)
```

### Key Functions

```sql
-- Activate subscription with key
activate_subscription(p_user_id, p_key_code) → JSONB

-- Check if user has active subscription
has_active_subscription(p_user_id) → BOOLEAN
```

---

## 🔧 Technical Notes

### Database Migration Needed

Add `region` field to users table:

```sql
ALTER TABLE public.users 
ADD COLUMN region TEXT;

-- Optional: Add constraint for valid wilayas
ALTER TABLE public.users 
ADD CONSTRAINT valid_region 
CHECK (region IS NULL OR region IN (
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna',
  'Béjaïa', 'Biskra', 'Béchar', 'Blida', 'Bouira',
  'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou',
  'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda',
  'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine',
  'Médéa', 'Mostaganem', 'M''Sila', 'Mascara', 'Ouargla',
  'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj', 'Boumerdès',
  'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela',
  'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma',
  'Aïn Témouchent', 'Ghardaïa', 'Relizane',
  -- New wilayas (2019)
  'Timimoun', 'Bordj Badji Mokhtar', 'Ouled Djellal', 'Béni Abbès',
  'In Salah', 'In Guezzam', 'Touggourt', 'Djanet',
  'El M''Ghair', 'El Meniaa'
));
```

### Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Key Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "@react-native-async-storage/async-storage": "^1.x",
    "expo": "~50.x",
    "expo-router": "~3.x",
    "expo-secure-store": "~12.x",
    "expo-device": "~5.x",
    "expo-linking": "~6.x",
    "nativewind": "^2.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "@hookform/resolvers": "^3.x"
  }
}
```

---

## ✅ Success Criteria

### MVP Requirements
- [ ] User can register with activation code
- [ ] User can login/logout
- [ ] Home shows modules for user's year
- [ ] User can practice questions
- [ ] Answers show correct/incorrect
- [ ] Results are saved
- [ ] User can save questions
- [ ] User can view statistics
- [ ] User can access resources

### Quality Requirements
- [ ] App loads in < 3 seconds
- [ ] Questions load in < 1 second
- [ ] No crashes
- [ ] Works offline (basic)
- [ ] Responsive on all screen sizes

---

## 🚀 Ready to Start!

This plan provides a clear roadmap for building the mobile app. Each phase builds on the previous one, ensuring steady progress toward a complete, polished application.

**Next Step**: Begin Phase 1 - Project Setup

---

*Last Updated: November 25, 2025*
