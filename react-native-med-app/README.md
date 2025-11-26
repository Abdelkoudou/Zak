# MCQ Study App - React Native Mobile Application

Medical exam preparation platform for Algerian medical students.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (for testing)

### Installation

```bash
# Navigate to the app directory
cd react-native-med-app

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your Supabase credentials

# Start the development server
npm start
```

### Running on Device

1. Install **Expo Go** on your phone (iOS/Android)
2. Run `npm start` in terminal
3. Scan the QR code with Expo Go

## 📁 Project Structure

```
react-native-med-app/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   │   ├── welcome.tsx    # Landing page
│   │   ├── login.tsx      # Login screen
│   │   ├── register.tsx   # Registration screen
│   │   └── forgot-password.tsx
│   ├── (tabs)/            # Main app tabs
│   │   ├── index.tsx      # Home (modules list)
│   │   ├── resources.tsx  # Course resources
│   │   └── profile.tsx    # User profile
│   ├── module/[id].tsx    # Module detail
│   ├── practice/          # Practice screens
│   │   ├── [moduleId].tsx # QCM session
│   │   └── results.tsx    # Results screen
│   └── saved/index.tsx    # Saved questions
├── src/
│   ├── components/        # Reusable components
│   ├── context/           # React Context
│   │   └── AuthContext.tsx
│   ├── lib/               # Services
│   │   ├── supabase.ts    # Supabase client
│   │   ├── auth.ts        # Authentication
│   │   ├── modules.ts     # Modules service
│   │   ├── questions.ts   # Questions service
│   │   ├── saved.ts       # Saved questions
│   │   ├── stats.ts       # Statistics
│   │   └── resources.ts   # Resources
│   ├── types/             # TypeScript types
│   └── constants/         # App constants
└── assets/                # Images, fonts
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from your Supabase project: **Settings → API**

## 📱 Features

### For Students
- ✅ Browse modules by year
- ✅ Practice QCM questions
- ✅ Immediate answer feedback
- ✅ Save difficult questions
- ✅ Track progress and statistics
- ✅ Access course resources

### Authentication
- ✅ Registration with activation code
- ✅ Login/logout
- ✅ Password reset
- ✅ Device session management (max 2)

## 🎨 Tech Stack

- **Framework**: React Native + Expo SDK 50
- **Routing**: Expo Router
- **Styling**: NativeWind (Tailwind CSS)
- **Backend**: Supabase
- **Language**: TypeScript

## 📦 Key Dependencies

- `expo` - Development platform
- `expo-router` - File-based routing
- `@supabase/supabase-js` - Backend client
- `nativewind` - Tailwind for React Native
- `react-hook-form` - Form handling

## 🔐 Database

The app connects to Supabase with these tables:
- `users` - User profiles
- `modules` - 26 predefined modules
- `questions` - MCQ questions
- `answers` - Answer options
- `saved_questions` - User bookmarks
- `test_attempts` - Practice results
- `course_resources` - Study materials
- `activation_keys` - Subscription keys
- `device_sessions` - Device tracking

## 📝 Scripts

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS (Mac only)
npm run lint       # Run ESLint
```

## 🚀 Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## 📄 License

Private - All rights reserved.
