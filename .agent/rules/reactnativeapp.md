# react-native-med-app Codebase Rules & Guidelines

This document outlines the specific coding standards, architectural patterns, and best practices for the `react-native-med-app` (Mobile Application).

## 1. Technology Stack & Environment

- **Framework**: Expo / React Native (Latest).
- **Language**: TypeScript (`.ts`, `.tsx`).
- **Styling**: NativeWind (Tailwind CSS for React Native).
- **Navigation**: Expo Router (File-based routing).
- **Backend/Auth**: Supabase (Auth, Database, Storage).
- **Forms**: React Hook Form + Zod.
- **Icons**: Lucide React Native (preferred) or Expo Vector Icons.
- **Storage**: AsyncStorage (via Supabase client or direct).

## 2. Project Structure

```
react-native-med-app/
├── app/                  # Expo Router pages and layouts
│   ├── (tabs)/          # Tab navigation routes
│   ├── (auth)/          # Authentication routes (login, signup)
│   ├── _layout.tsx      # Root layout / Stack configuration
│   └── [route]/         # Dynamic routes
├── assets/               # Static assets (images, fonts)
├── components/           # Reusable UI components
├── lib/                  # Business logic and configurations
│   ├── supabase.ts      # Singleton Supabase client
│   └── [feature].ts     # Feature-specific logic
├── scripts/              # Helper scripts
└── src/                  # Additional source code (types, utils)
```

## 3. Core Coding Standards

### TypeScript
- **Strict Typing**: Avoid `any`. Use interfaces.
- **Components**: `React.FC` is not strictly required; function expressions are fine.
- **Props**: Define `interface ComponentNameProps`.

### Components
- **Functional Components**: Use arrow functions or `function` keyword consistently.
- **Safe Area**: ALWAYS wrap top-level page content in `SafeAreaView` (from `react-native-safe-area-context`) or handle in Layout.
- **Exports**: Named exports preferred for components. Default exports for Pages (`index.tsx`, `profile.tsx`).

### Styling (NativeWind)
- **Usage**: Use `className="..."` prop on standard React Native components (`View`, `Text`, `Image`) and custom components wrapped with `cssInterop`.
- **Colors**: Use the configured Tailwind colors (e.g., `text-primary-500`, `bg-slate-100`).
- **Responsiveness**: Use NativeWind's responsive prefixes if needed, but primarily design for mobile.

### Navigation (Expo Router)
- **Routing**: processing standard file system routing.
- **Navigation**: Use `router.push()`, `router.replace()`, or `<Link href="..." />`.
- **Params**: Access params via `useLocalSearchParams()`.

## 4. Specific Implementation Guidelines

### Data Fetching & Auth
- **Supabase**: Import `supabase` from `@/lib/supabase` (or relative path if alias not configured).
- **Platform Specifics**: The `lib/supabase.ts` handles platform differences (Web vs Native). Trust it.
- **Session**: Use `supabase.auth.getSession()` for one-off checks.
- **Real-time**: Use `supabase.channel()` for subscriptions.

### UI patterns
- **Layouts**: Use `_layout.tsx` to define Stacks and Tabs.
- **Modals**: detailed configuration in `app/_layout.tsx` using `presentation: 'modal'`.
- **Status Bar**: Use `<StatusBar />` from `expo-status-bar` to control style (light/dark).

### Native Features
- **Platform Checks**: Use `Platform.OS === 'ios'` or `Platform.OS === 'android'` for specific logic.
- **Keyboard**: Handle keyboard avoiding (if not handled by libraries) using `KeyboardAvoidingView`.

## 5. Critical Configurations
- **app.json**: Expo config (bundle IDs, splash screen, adaptive icons).
- **babel.config.js**: NativeWind configuration.
- **metro.config.js**: Metro bundler settings.

---
*Follow these rules to ensure consistency with the existing codebase architecture.*
