# MCQ Study App - Features Specification

## Document Purpose
This document defines the **SIMPLIFIED** feature set for the MCQ Study App MVP (Minimum Viable Product). We focus on **mobile app only** with **core MCQ features** and **course resources**.

---

## 🎯 **MVP SCOPE (What We're Building)**

### ✅ **IN SCOPE**
- Mobile app (iOS + Android)
- MCQ practice with French medical structure
- User authentication and profiles
- Saved questions
- Course resources (Google Drive links)
- Basic test results tracking
- Admin dashboard

### ❌ **OUT OF SCOPE (Future Phases)**
- Website/web app
- Study timer
- Advanced analytics/charts
- Payment receipt upload
- Gamification (badges, leaderboards)
- Arabic localization
- Push notifications
- Offline mode (advanced)

---

## 1. User Authentication & Management

### 1.1 User Registration
**Description**: Students can create an account to access the app.

**Features**:
- Register with email, username, password
- Optional: year of study (1/2/3), speciality (Médecine, Pharmacie, Dentaire)
- Email validation
- Password strength requirements (min 8 characters)
- Automatic role assignment (Student)

**User Story**:
> As a medical student, I want to create an account so that I can access MCQ questions and track my progress.

**Acceptance Criteria**:
- ✅ User can register with valid email and password
- ✅ Duplicate emails are rejected
- ✅ User receives confirmation of successful registration
- ✅ User is automatically logged in after registration

---

### 1.2 User Login
**Description**: Users can log in to access their account.

**Features**:
- Login with email/username and password
- JWT token-based authentication
- Token stored securely in AsyncStorage
- Session persistence across app restarts
- "Remember me" functionality

**User Story**:
> As a registered user, I want to log in so that I can access my saved questions and progress.

**Acceptance Criteria**:
- ✅ User can log in with valid credentials
- ✅ Invalid credentials show error message
- ✅ User stays logged in after closing app
- ✅ Token expires after 30 minutes of inactivity

---

### 1.3 User Profile
**Description**: Users can view and edit their profile information.

**Features**:
- View profile (email, username, year of study, speciality)
- Edit profile information
- Change password
- View account status (paid/unpaid)
- View subscription expiry date

**User Story**:
> As a user, I want to view and update my profile so that my information is current.

**Acceptance Criteria**:
- ✅ User can view their profile
- ✅ User can update year of study and speciality
- ✅ User can change password with current password verification
- ✅ Changes are saved and reflected immediately

---

### 1.4 Device Management
**Description**: Users can manage up to 2 devices for their account.

**Features**:
- Register device with unique fingerprint
- View list of active devices
- Deactivate a device
- Automatic device limit enforcement (max 2)
- Device name display (e.g., "iPhone 12", "Samsung Galaxy")

**User Story**:
> As a user, I want to use the app on my phone and tablet so that I can study anywhere.

**Acceptance Criteria**:
- ✅ User can register up to 2 devices
- ✅ Third device registration deactivates oldest device
- ✅ User can manually deactivate a device
- ✅ Device list shows device name and last seen time

---

## 2. Subscription & Activation

### 2.1 Activation Keys
**Description**: Students activate their account using a purchased activation key.

**Features**:
- Enter activation key in app
- Key validation (single-use, not expired)
- Account activation (sets is_paid = true)
- Subscription expiry date (1 year from activation)
- Activation confirmation message

**User Story**:
> As a student who purchased a subscription card, I want to activate my account so that I can access all questions.

**Acceptance Criteria**:
- ✅ User can enter activation key
- ✅ Valid key activates account immediately
- ✅ Invalid/used key shows error message
- ✅ Expiry date is set to 1 year from activation
- ✅ User can see expiry date in profile

---

### 2.2 Payment Status
**Description**: Users can view their payment/subscription status.

**Features**:
- View subscription status (active/expired)
- View expiry date
- Renewal reminder (when approaching expiry)
- Access restriction for unpaid users

**User Story**:
> As a user, I want to know when my subscription expires so that I can renew on time.

**Acceptance Criteria**:
- ✅ Paid users can access all questions
- ✅ Unpaid users see "Subscribe to access" message
- ✅ Expiry date is clearly displayed
- ✅ Users are notified 7 days before expiry

---

## 3. MCQ Questions & Practice

### 3.1 Browse Questions
**Description**: Users can browse and filter MCQ questions.

**Features**:
- View questions by module/unit
- Filter by:
  - Study year (1st, 2nd, 3rd)
  - Module (Anatomie, Biochimie, etc.)
  - Unit (for 2nd/3rd year)
  - Exam type (EMD, EMD1, EMD2, Rattrapage)
  - Year (2020-2024)
- Pagination (load more)
- Question count display

**User Story**:
> As a student, I want to browse questions by module so that I can practice specific topics.

**Acceptance Criteria**:
- ✅ User can see list of modules
- ✅ User can filter questions by multiple criteria
- ✅ Questions load in pages (20 per page)
- ✅ Question count is displayed for each filter

---

### 3.2 Practice Questions
**Description**: Users can practice MCQ questions with immediate feedback.

**Features**:
- Display question text
- Display answer options (A, B, C, D, E)
- Select answer(s)
- Submit answer
- Show correct/incorrect immediately
- Show correct answer(s)
- Navigate to next/previous question
- Question progress indicator

**User Story**:
> As a student, I want to practice questions and see if I'm correct so that I can learn from my mistakes.

**Acceptance Criteria**:
- ✅ User can select one or multiple answers
- ✅ Correct answers are highlighted in green
- ✅ Incorrect answers are highlighted in red
- ✅ Correct answer is always shown after submission
- ✅ User can navigate between questions

---

### 3.3 Question Details
**Description**: Each question displays comprehensive information.

**Features**:
- Question number
- Module/Unit name
- Exam type and year
- Question text
- Answer options with labels (A-E)
- Correct answer indicator
- Save/unsave button

**User Story**:
> As a student, I want to see all question details so that I understand the context.

**Acceptance Criteria**:
- ✅ All metadata is displayed clearly
- ✅ Question text is readable and formatted
- ✅ Answer options are clearly labeled
- ✅ Correct answer is marked after submission

---

### 3.4 Medical Structure Support
**Description**: Questions are organized according to French medical education structure.

**Structure**:

**1st Year (1ère Année)**:
- Annual modules: Anatomie, Biochimie, Biophysique, Biostatistique/Informatique, Chimie, Cytologie
  - Exam types: EMD1, EMD2, Rattrapage
- Semestrial modules: Embryologie, Histologie, Physiologie, S.S.H
  - Exam types: EMD, Rattrapage

**2nd Year (2ème Année)**:
- Units (UEI):
  - Appareil Cardio-vasculaire et Respiratoire
  - Appareil Digestif
  - Appareil Urinaire
  - Appareil Endocrinien et de la Reproduction
  - Appareil Nerveux et Organes des Sens
- Standalone modules: Génétique, Immunologie
- Exam types: EMD, Rattrapage

**3rd Year (3ème Année)**:
- Units:
  - Appareil Cardio-vasculaire et Appareil Respiratoire
  - Psychologie Médicale et Semiologie Générale
  - Appareil Neurologique
  - Appareil Endocrinien
  - Appareil Urinaire
  - Appareil Digestif
- Standalone modules: Anatomie pathologique, Immunologie, Pharmacologie, Microbiologie, Parasitologie
- Exam types: EMD, Rattrapage

**User Story**:
> As a medical student, I want questions organized by my curriculum so that I can study relevant material.

**Acceptance Criteria**:
- ✅ Questions are categorized by year, module, and exam type
- ✅ Structure matches official French medical curriculum
- ✅ Filters work correctly for all categories

---

## 4. Saved Questions

### 4.1 Save Questions
**Description**: Users can save questions for later review.

**Features**:
- Save button on each question
- Visual indicator (heart icon, filled/unfilled)
- Save/unsave toggle
- Saved count display
- Sync across devices

**User Story**:
> As a student, I want to save difficult questions so that I can review them later.

**Acceptance Criteria**:
- ✅ User can save any question
- ✅ Saved status is visible immediately
- ✅ User can unsave a question
- ✅ Saved questions persist across sessions

---

### 4.2 View Saved Questions
**Description**: Users can view all their saved questions.

**Features**:
- Dedicated "Saved Questions" screen
- List of all saved questions
- Same filtering options as main questions
- Remove from saved
- Practice saved questions

**User Story**:
> As a student, I want to review my saved questions so that I can focus on difficult topics.

**Acceptance Criteria**:
- ✅ User can see all saved questions
- ✅ User can filter saved questions
- ✅ User can remove questions from saved
- ✅ User can practice saved questions

---

## 5. Test Results & Statistics

### 5.1 Test Submission
**Description**: After completing a practice session, results are recorded.

**Features**:
- Record questions attempted
- Record correct/incorrect count
- Calculate score percentage
- Record time spent
- Save to history

**User Story**:
> As a student, I want my practice results saved so that I can track my progress.

**Acceptance Criteria**:
- ✅ Results are saved after each practice session
- ✅ Score is calculated correctly
- ✅ Time spent is recorded
- ✅ Results are linked to user account

---

### 5.2 Test History
**Description**: Users can view their past test results.

**Features**:
- List of all test attempts
- Date and time of each test
- Module/topic tested
- Score and accuracy
- Questions attempted count
- Sort by date (newest first)

**User Story**:
> As a student, I want to see my test history so that I can track my improvement.

**Acceptance Criteria**:
- ✅ User can see all past tests
- ✅ Tests are sorted by date
- ✅ Each test shows score and details
- ✅ User can tap to see test details

---

### 5.3 Basic Statistics
**Description**: Users can view basic performance statistics.

**Features**:
- Overall accuracy percentage
- Total questions attempted
- Total correct answers
- Average score
- Best score
- Recent performance (last 7 days)

**User Story**:
> As a student, I want to see my overall performance so that I know where I stand.

**Acceptance Criteria**:
- ✅ Statistics are calculated correctly
- ✅ Statistics update after each test
- ✅ User can see overall and recent stats
- ✅ Stats are displayed in an easy-to-read format

---

## 6. Course Resources

### 6.1 Browse Resources
**Description**: Users can access course resources (Google Drive links).

**Features**:
- List of resources by category
- Categories:
  - Google Drive (past exams, notes)
  - Telegram channels
  - PDF documents
  - Video lectures
- Filter by year, module
- Resource title and description
- External link icon

**User Story**:
> As a student, I want to access course materials so that I can supplement my MCQ practice.

**Acceptance Criteria**:
- ✅ User can see all available resources
- ✅ Resources are categorized clearly
- ✅ User can filter by year and module
- ✅ Links open in external browser/app

---

### 6.2 Open Resources
**Description**: Users can open external resources.

**Features**:
- Tap to open link
- Opens in external browser (Google Drive, Telegram, etc.)
- Confirmation dialog (optional)
- Track resource access (analytics)

**User Story**:
> As a student, I want to open course resources so that I can study additional materials.

**Acceptance Criteria**:
- ✅ Links open correctly in external apps
- ✅ Google Drive links open in Drive app (if installed)
- ✅ Telegram links open in Telegram app (if installed)
- ✅ User can return to app easily

---

## 7. Admin Features

### 7.1 Dashboard
**Description**: Admins can view system statistics.

**Features**:
- Total users count
- Paid/unpaid users
- Total questions count
- Total activation keys (used/unused)
- Recent user registrations
- Recent activations

**User Story**:
> As an admin, I want to see system statistics so that I can monitor the platform.

**Acceptance Criteria**:
- ✅ Dashboard shows accurate statistics
- ✅ Statistics update in real-time
- ✅ Admin can see user growth trends
- ✅ Admin can see activation key usage

---

### 7.2 User Management
**Description**: Admins can manage user accounts.

**Features**:
- List all users
- Filter by role, payment status
- View user details
- Update payment status
- Change user role
- Delete user (except owner)
- Search users

**User Story**:
> As an admin, I want to manage users so that I can handle support requests.

**Acceptance Criteria**:
- ✅ Admin can see all users
- ✅ Admin can update user payment status
- ✅ Admin can change user roles
- ✅ Owner account cannot be modified

---

### 7.3 Activation Key Management
**Description**: Admins can generate and manage activation keys.

**Features**:
- Generate new activation keys
- List all keys (used/unused)
- View key details (created by, used by, date)
- Key statistics
- Export keys to CSV

**User Story**:
> As an admin, I want to generate activation keys so that I can sell subscriptions.

**Acceptance Criteria**:
- ✅ Admin can generate keys
- ✅ Keys are unique and secure
- ✅ Admin can see key usage status
- ✅ Admin can export keys for distribution

---

### 7.4 Question Management
**Description**: Managers/Admins can manage MCQ questions.

**Features**:
- Create new questions
- Edit existing questions
- Delete questions
- Import questions from JSON
- View question statistics
- Search questions

**User Story**:
> As a manager, I want to add questions so that students have content to practice.

**Acceptance Criteria**:
- ✅ Manager can create questions with answers
- ✅ Manager can edit question details
- ✅ Manager can delete questions
- ✅ Manager can import bulk questions

---

### 7.5 Resource Management
**Description**: Admins can manage course resources.

**Features**:
- Add new resources
- Edit resource details
- Delete resources
- Categorize resources
- Link to modules/years

**User Story**:
> As an admin, I want to add course resources so that students have study materials.

**Acceptance Criteria**:
- ✅ Admin can add resources with links
- ✅ Admin can categorize resources
- ✅ Admin can link resources to modules
- ✅ Admin can delete outdated resources

---

## 8. User Roles & Permissions

### Role Hierarchy
```
Owner > Admin > Manager > Student
```

### Permission Matrix

| Feature | Owner | Admin | Manager | Student |
|---------|-------|-------|---------|---------|
| View questions | ✅ | ✅ | ✅ | ✅ (if paid) |
| Save questions | ✅ | ✅ | ✅ | ✅ |
| Create questions | ✅ | ✅ | ✅ | ❌ |
| Delete questions | ✅ | ✅ | ✅ | ❌ |
| Generate activation keys | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ✅ | ✅ (limited) | ❌ |
| Change user roles | ✅ | ✅ | ❌ | ❌ |
| View dashboard | ✅ | ✅ | ❌ | ❌ |
| Manage resources | ✅ | ✅ | ✅ | ❌ |
| View resources | ✅ | ✅ | ✅ | ✅ |

---

## 9. Non-Functional Requirements

### 9.1 Performance
- App launch time: < 3 seconds
- Question load time: < 1 second
- API response time: < 500ms
- Smooth scrolling (60 FPS)

### 9.2 Security
- JWT token authentication
- Password hashing (bcrypt)
- HTTPS only in production
- Device limit enforcement
- Role-based access control

### 9.3 Usability
- Intuitive navigation
- Clear error messages
- Loading indicators
- Offline message when no connection
- Touch-friendly UI (min 44x44 touch targets)

### 9.4 Compatibility
- iOS 13+
- Android 8.0+
- Portrait and landscape orientation
- Various screen sizes (phones, tablets)

### 9.5 Reliability
- 99% uptime
- Automatic error recovery
- Data persistence (AsyncStorage)
- Graceful degradation

---

## 10. Future Features (Post-MVP)

### Phase 2 (After Launch)
- Study timer with focus mode
- Advanced analytics with charts
- Push notifications for reminders
- Offline mode (full question caching)
- Dark mode
- Search functionality

### Phase 3 (Growth)
- Arabic language support
- Payment receipt upload
- Gamification (badges, streaks)
- Leaderboards
- Social features (share progress)
- Web app version

### Phase 4 (Scale)
- AI-powered question recommendations
- Adaptive learning paths
- Video explanations for questions
- Live study sessions
- Community forums

---

## Success Metrics

### Launch Goals (First 3 Months)
- 500+ registered users
- 100+ paid subscriptions
- 10,000+ questions attempted
- 4.0+ app store rating
- < 5% crash rate

### User Engagement
- Daily active users: 30%
- Weekly active users: 60%
- Average session time: 15 minutes
- Questions per session: 20+
- Return rate: 70%

---

## Conclusion

This feature specification defines a focused MVP that delivers core value to medical students while remaining achievable within the 10-day timeline. All features are designed to be simple, effective, and aligned with the needs of the Algerian medical education market.

**Next Steps**:
1. Review and approve features
2. Create detailed API specifications
3. Design UI mockups
4. Begin development
5. Test and iterate
