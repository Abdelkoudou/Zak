# Technology Stack

## Primary Applications

### React Native Mobile App (Primary)
- **Framework**: React Native with Expo SDK 53
- **Language**: TypeScript 5.8+
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context API
- **Storage**: AsyncStorage, Expo SecureStore
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Forms**: React Hook Form + Zod validation
- **Icons**: Expo Vector Icons
- **Animations**: React Native Reanimated

### Next.js Admin Interface (Secondary)
- **Framework**: Next.js 14.2+
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 3.4+
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **AI Integration**: Google Generative AI

## Backend & Database

- **Backend**: Supabase (managed cloud platform)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with JWT tokens
- **Storage**: Supabase Storage for files
- **Real-time**: Supabase Realtime subscriptions

## Common Commands

### React Native Mobile App

```bash
# Setup
cd react-native-med-app
npm install

# Development
npm start                    # Start Expo dev server
npm run android             # Run on Android
npm run ios                 # Run on iOS (Mac only)
npm run web                 # Run on web

# Building
npm run build:android       # Build Android APK with EAS
npm run build:ios          # Build iOS IPA with EAS
npm run build:web          # Build for web deployment

# Linting
npm run lint               # Run ESLint
```

### Next.js Admin Interface

```bash
# Setup
cd db-interface
npm install

# Development
npm run dev                # Development server (localhost:3005)
npm run build             # Production build
npm start                 # Production server

# Linting
npm run lint              # Run ESLint
```

## Code Style Guidelines

### TypeScript (Both Apps)
- Use TypeScript strict mode
- Functional components only (no class components)
- Use interfaces for props and data structures
- Follow React best practices and hooks patterns
- Use proper type imports: `import type { ... }`

### React Native Specific
- Use Expo managed workflow
- Prefer NativeWind classes over StyleSheet
- Use Expo Router for navigation
- Handle platform differences with Platform.OS
- Use proper safe area handling

### Next.js Specific
- Use App Router (not Pages Router)
- Server Components by default, Client Components when needed
- Proper error boundaries and loading states
- Use Supabase SSR for server-side auth

## Environment Variables

### React Native (.env)
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Next.js (.env.local)
```env
# Public (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Secret (server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
GOOGLE_AI_API_KEY=AIza...
```

## Database Schema

Key tables and relationships:
- **users**: User accounts with roles (owner, admin, manager, student)
- **modules**: 26 predefined modules from French curriculum
- **questions**: MCQ questions with metadata
- **answers**: Answer options (A-E) linked to questions
- **activation_keys**: Subscription management
- **device_sessions**: Device tracking (max 2 per user)
- **saved_questions**: User bookmarks
- **test_attempts**: Practice results
- **course_resources**: Study materials links

## API Architecture

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Row Level Security (RLS) policies
- **Real-time**: Supabase Realtime for live updates
- **File Storage**: Supabase Storage for images/documents
- **AI Features**: Google Generative AI for chat assistance

## Deployment

### React Native
- **Development**: Expo Go app for testing
- **Production**: EAS Build for app store deployment
- **Web**: Static export to Netlify/Vercel

### Next.js Admin
- **Platform**: Vercel (recommended)
- **Domain**: Custom domain with HTTPS
- **Environment**: Production environment variables

## Security Considerations

- Never expose service role key to client-side code
- Use RLS policies for data access control
- Implement proper authentication flows
- Validate all user inputs with Zod schemas
- Use HTTPS in production
- Implement rate limiting for API endpoints