# MCQ Study App - Medical Exam Preparation Platform

**Mobile application for Algerian medical students to practice MCQ questions based on the French medical curriculum.**

---

## 🎯 Project Overview

A React Native mobile app that helps medical students (1st, 2nd, 3rd year) prepare for their exams through:
- 📚 Practice MCQ questions organized by year, module, and exam type
- 💾 Save difficult questions for review
- 📊 Track test results and progress
- 📖 Access course resources (Google Drive, Telegram)
- 🔌 Offline-first architecture (works without internet)
- ⚡ Instant content updates (no app store approval needed)

---

## 🏗️ Architecture

### Technology Stack
- **Mobile App**: React Native with Expo SDK 50
- **Backend**: Supabase (managed cloud platform)
- **Database**: PostgreSQL (for user data)
- **Storage**: JSON files (for questions)
- **Authentication**: Email/password with JWT tokens

### Why This Architecture?
- ✅ **$0/month** for up to 50,000 users
- ✅ **Fast**: Questions load instantly (offline-first)
- ✅ **Flexible**: Update questions without app store approval
- ✅ **Scalable**: Handles thousands of concurrent users

---

## 📁 Project Structure

```
mcq-study-app/
│
├── .git/                         # Version control
├── .kiro/                        # Kiro steering files
│   └── steering/
│       ├── structure.md          # Project structure guidelines
│       ├── tech.md               # Technology stack guidelines
│       └── product.md            # Product requirements
│
├── react-native-med-app/         # Mobile app (React Native + Expo)
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── screens/              # App screens
│   │   ├── services/             # API services
│   │   ├── navigation/           # Navigation configuration
│   │   ├── context/              # React Context
│   │   └── data/                 # Bundled JSON questions
│   ├── assets/                   # Images, fonts, icons
│   ├── App.tsx                   # Root component
│   ├── app.json                  # Expo configuration
│   └── package.json              # Dependencies
│
├── docs/                          # Archived documentation
│   ├── README.md                 # Documentation archive guide
│   ├── ARCHITECTURE.md           # Old architecture (archived)
│   ├── API_SPECIFICATION.md      # Old API docs (archived)
│   └── ...                       # Other archived docs
│
├── CLIENT_ROADMAP.md             # Client presentation (20-day plan)
├── ROADMAP.md                    # Technical roadmap (detailed)
├── README.md                     # This file
├── .gitignore
└── .gitattributes
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`
- Supabase account (free): https://supabase.com

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mcq-study-app
   ```

2. **Setup Supabase** (see CLIENT_ROADMAP.md Day 1)
   - Create Supabase project
   - Setup database tables
   - Configure authentication
   - Upload initial JSON files

3. **Install mobile app dependencies**
   ```bash
   cd react-native-med-app
   npm install
   ```

4. **Configure environment**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Add your Supabase credentials
   SUPABASE_URL=your-project-url
   SUPABASE_ANON_KEY=your-anon-key
   ```

5. **Start development**
   ```bash
   npm start
   
   # Then:
   # - Press 'a' for Android emulator
   # - Press 'i' for iOS simulator (Mac only)
   # - Scan QR code with Expo Go app on your phone
   ```

---

## 📅 Development Timeline

**Total Duration**: 20 days

- **Week 1 (Days 1-5)**: Foundation (Backend + Mobile setup)
- **Week 2 (Days 6-10)**: Core Features (Auth + Questions)
- **Week 3 (Days 11-15)**: Advanced Features (Saved, Results, Resources)
- **Week 4 (Days 16-20)**: Polish & Launch (Testing + Deployment)

See **CLIENT_ROADMAP.md** for detailed day-by-day breakdown.

---

## 📚 Documentation

- **CLIENT_ROADMAP.md** - Client presentation with 20-day timeline
- **ROADMAP.md** - Detailed technical roadmap
- **.kiro/steering/** - Project guidelines and standards

---

## 🎓 French Medical Curriculum Support

### 1st Year (1ère Année)
- **Annual Modules**: Anatomie, Biochimie, Biophysique, Biostatistique, Chimie, Cytologie
- **Semestrial Modules**: Embryologie, Histologie, Physiologie, S.S.H
- **Exam Types**: EMD1, EMD2, Rattrapage

### 2nd Year (2ème Année)
- **Units**: Cardio-vasculaire, Digestif, Urinaire, Endocrinien, Nerveux
- **Standalone**: Génétique, Immunologie
- **Exam Types**: EMD, Rattrapage

### 3rd Year (3ème Année)
- **Units**: Similar to 2nd year
- **Standalone**: Anatomie pathologique, Pharmacologie, Microbiologie, Parasitologie
- **Exam Types**: EMD, Rattrapage

---

## 💰 Cost Breakdown

### Infrastructure (Monthly)
- **0-50,000 users**: $0/month (Supabase free tier)
- **50,000-100,000 users**: $25/month (Supabase Pro)
- **100,000+ users**: $50-100/month

### One-Time Costs
- **Google Play Developer**: $25 (one-time)
- **Apple Developer**: $99/year (optional, for iOS)

---

## 🎯 Key Features

### For Students
- ✅ Practice MCQ questions by year, module, and exam type
- ✅ Save difficult questions for review
- ✅ Track test results and progress
- ✅ Access course resources (Google Drive, Telegram)
- ✅ Offline-first (works without internet)
- ✅ View statistics and analytics

### For Admins
- ✅ Add/update questions via JSON
- ✅ Generate activation keys
- ✅ Manage users and subscriptions
- ✅ View usage statistics
- ✅ Instant content updates (no app store approval)

---

## 🔒 Security & Privacy

- Encrypted passwords (bcrypt)
- Secure authentication (JWT tokens)
- HTTPS only in production
- Row-level security on database
- Max 2 devices per user
- GDPR compliant

---

## 📱 Supported Platforms

- **Android**: 8.0+ (API level 26+)
- **iOS**: 13.0+ (optional, requires Mac for development)
- **Devices**: Smartphones and tablets

---

## 🤝 Contributing

This is a client project. For development guidelines, see:
- `.kiro/steering/structure.md` - Project structure
- `.kiro/steering/tech.md` - Technology stack
- `.kiro/steering/product.md` - Product requirements

---

## 📞 Support

For questions or issues:
- Review **CLIENT_ROADMAP.md** for project plan
- Review **ROADMAP.md** for technical details
- Check `.kiro/steering/` for guidelines

---

## 📈 Success Metrics

### Launch Goals (First 3 Months)
- 500+ registered users
- 100+ paid subscriptions
- 10,000+ questions attempted
- 4.0+ app store rating

### Growth Goals (6 Months)
- 5,000+ registered users
- 500+ paid subscriptions
- 100,000+ questions attempted
- 60% user retention

---

## 🚀 Next Steps

1. **Review** CLIENT_ROADMAP.md for the 20-day plan
2. **Setup** Supabase project (Day 1)
3. **Start** mobile app development (Day 2)
4. **Test** thoroughly (Days 16-17)
5. **Deploy** to app stores (Days 18-20)
6. **Launch!** 🎉

---

**Built for Algerian medical students following the French curriculum** 🇩🇿

*Last updated: January 2024*
