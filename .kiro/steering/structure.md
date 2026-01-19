# Project Structure

## Repository Organization

This is a monorepo containing multiple applications:

```
mcq-study-app/
├── react-native-med-app/       # React Native mobile app (PRIMARY)
├── db-interface/               # Next.js admin interface (SECONDARY)
├── supabase/                   # Database schema and migrations
├── docs/                       # Project documentation
├── .kiro/                      # Kiro steering files
└── README.md                   # Project overview
```

## React Native App Structure (Primary)

```
react-native-med-app/
├── app/                        # Expo Router screens
│   ├── (auth)/                # Authentication flow
│   │   ├── welcome.tsx        # Landing page
│   │   ├── login.tsx          # Login screen
│   │   ├── register.tsx       # Registration
│   │   ├── forgot-password.tsx
│   │   └── _layout.tsx        # Auth layout
│   ├── (tabs)/                # Main app navigation
│   │   ├── index.tsx          # Home (modules list)
│   │   ├── resources.tsx      # Course resources
│   │   ├── profile.tsx        # User profile
│   │   └── _layout.tsx        # Tab layout
│   ├── module/[id].tsx        # Module detail screen
│   ├── practice/              # Practice screens
│   │   ├── [moduleId].tsx     # QCM practice session
│   │   └── results.tsx        # Results screen
│   ├── saved/index.tsx        # Saved questions
│   ├── auth/callback.tsx      # Auth callback
│   └── _layout.tsx            # Root layout
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   └── icons/             # Icon components
│   ├── context/               # React Context providers
│   │   ├── AuthContext.tsx    # Authentication state
│   │   └── ThemeContext.tsx   # Theme management
│   ├── lib/                   # Services and utilities
│   │   ├── supabase.ts        # Supabase client
│   │   ├── auth.ts            # Authentication logic
│   │   ├── modules.ts         # Modules API
│   │   ├── questions.ts       # Questions API
│   │   ├── saved.ts           # Saved questions
│   │   ├── stats.ts           # Statistics
│   │   ├── resources.ts       # Resources API
│   │   └── deviceId.ts        # Device identification
│   ├── types/                 # TypeScript definitions
│   │   └── index.ts           # App-specific types
│   └── constants/             # App constants
│       ├── index.ts           # General constants
│       ├── faculty.ts         # Faculty/region data
│       └── theme.ts           # Theme configuration
├── assets/                    # Static assets
│   ├── images/                # Images and logos
│   └── icons/                 # SVG icons
├── app.json                   # Expo configuration
├── package.json               # Dependencies
├── tailwind.config.js         # Tailwind configuration
└── global.css                 # Global styles
```

## Next.js Admin Interface Structure

```
db-interface/
├── app/                       # Next.js App Router
│   ├── (admin)/              # Admin-only routes
│   ├── api/                  # API routes
│   │   ├── admin/            # Admin endpoints
│   │   ├── chat/             # AI chat endpoints
│   │   ├── questions/        # Questions API
│   │   ├── resources/        # Resources API
│   │   └── webhooks/         # Webhook handlers
│   ├── login/                # Login page
│   ├── questions/            # Questions management
│   ├── users/                # User management
│   ├── courses/              # Course management
│   ├── ai-chat/              # AI chat interface
│   └── layout.tsx            # Root layout
├── components/               # React components
│   ├── ui/                   # Base UI components
│   ├── AppLayout.tsx         # Main app layout
│   ├── Sidebar.tsx           # Navigation sidebar
│   └── ...
├── lib/                      # Utilities and services
│   ├── api/                  # API client functions
│   ├── security/             # Security utilities
│   ├── supabase.ts           # Supabase client
│   ├── supabase-admin.ts     # Admin Supabase client
│   └── ai-models.ts          # AI model configuration
├── types/                    # TypeScript definitions
│   ├── database.ts           # Database types
│   └── supabase.ts           # Supabase types
├── scripts/                  # Utility scripts
├── package.json              # Dependencies
└── next.config.js            # Next.js configuration
```

## Supabase Structure

```
supabase/
├── migrations/               # Database migrations
│   ├── 001_initial_schema.sql
│   ├── 002_question_improvements.sql
│   └── ...
├── schema.sql               # Complete database schema
├── types.ts                 # TypeScript types
├── seed.sql                 # Sample data
└── README.md                # Setup instructions
```

## Key Architecture Patterns

### File-Based Routing (React Native)
- Uses Expo Router for file-based navigation
- Parentheses `()` for route groups (auth, tabs)
- Square brackets `[]` for dynamic routes
- Underscore `_` for layout files

### Component Organization
- **UI Components**: Reusable, unstyled base components
- **Feature Components**: Business logic components
- **Screen Components**: Full-screen views
- **Layout Components**: Navigation and structure

### Service Layer Pattern
- **API Services**: Handle HTTP requests to Supabase
- **Auth Service**: Authentication logic
- **Storage Service**: Local storage management
- **Validation**: Zod schemas for type safety

### State Management
- **React Context**: Global state (auth, theme)
- **Local State**: Component-specific state with hooks
- **Server State**: Supabase real-time subscriptions

## Database Models

Key relationships:
- **Users** → **DeviceSessions** (1:2 max)
- **Users** → **SavedQuestions** (1:many)
- **Users** → **TestAttempts** (1:many)
- **Modules** → **Questions** (1:many)
- **Questions** → **Answers** (1:5 max, A-E)
- **Modules** → **CourseResources** (1:many)

## File Naming Conventions

### React Native
- **Screens**: PascalCase with descriptive names (`LoginScreen.tsx`)
- **Components**: PascalCase (`Button.tsx`, `QuestionCard.tsx`)
- **Services**: camelCase (`auth.ts`, `questions.ts`)
- **Types**: camelCase (`index.ts`, `database.ts`)
- **Constants**: camelCase (`theme.ts`, `faculty.ts`)

### Next.js
- **Pages**: kebab-case for routes (`login/page.tsx`)
- **Components**: PascalCase (`Sidebar.tsx`)
- **API Routes**: kebab-case (`route.ts`)
- **Utilities**: camelCase (`validation.ts`)

## Import/Export Patterns

### Barrel Exports
```typescript
// src/components/ui/index.ts
export { Button } from './Button'
export { Card } from './Card'
export { Input } from './Input'
```

### Type-Only Imports
```typescript
import type { Database } from '@/types/supabase'
import type { User } from '@supabase/supabase-js'
```

### Relative vs Absolute Imports
- Use absolute imports with `@/` alias for src directory
- Use relative imports for nearby files in same feature

## Security Architecture

### Authentication Flow
1. User registers/logs in via Supabase Auth
2. JWT token stored in secure storage
3. Token included in API requests
4. RLS policies enforce data access

### Role-Based Access Control
- **Owner**: Full system access (cannot be modified)
- **Admin**: User management, question management, key generation
- **Manager**: Question management only
- **Student**: Browse questions (if paid), practice, save questions

### Data Protection
- Row Level Security (RLS) on all tables
- Service role key server-side only
- Input validation with Zod schemas
- Device session limits (max 2 per user)