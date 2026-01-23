# db-interface Codebase Rules & Guidelines

This document outlines the specific coding standards, architectural patterns, and best practices for the `db-interface` project (Next.js Admin Dashboard).

## 1. Technology Stack & Environment

- **Framework**: Next.js 14+ (App Router).
- **Language**: TypeScript (`.ts`, `.tsx`).
- **Styling**: Tailwind CSS (with specific custom color palettes).
- **Backend/Auth**: Supabase (Auth, Database, Storage).
- **Validation**: Zod.
- **State Management**: React Hooks & Context.
- **Icons**: Emoji based navigation icons (primary) or SVGs.
- **Motion**: `framer-motion` for animations.

## 2. Project Structure

```
db-interface/
├── app/                  # App Router pages and layouts
│   ├── (auth)/          # Authentication routes
│   ├── api/             # API Routes (Next.js server-side)
│   ├── globals.css      # Global styles and Tailwind directives
│   └── layout.tsx       # Root layout
├── components/           # Reusable UI components
│   ├── ui/              # Generic UI components (buttons, inputs)
│   └── [Feature].tsx    # Feature-specific components
├── lib/                  # Business logic and configurations
│   ├── supabase.ts      # Client-side Supabase client
│   ├── supabase-admin.ts # Admin Supabase client (service role)
│   └── [feature].ts     # Feature-specific logic (e.g., activation-codes.ts)
├── types/                # TypeScript type definitions
│   └── supabase.ts      # Generated Database types
└── public/               # Static assets
```

## 3. Core Coding Standards

### TypeScript
- **Strict Typing**: No `any`. Use interfaces or types defined in `types/` or locally if specific to a component.
- **Supabase Types**: Always use `Database` types from `@/types/supabase` for DB operations.
- **Props**: Define `interface` for all component props.

### Components
- **Client vs Server**:
  - Default to **Server Components** where possible.
  - Use `"use client"` at the very top of files requiring state (`useState`, `useEffect`) or browser interaction.
- **Naming**: PascalCase for components (`Sidebar.tsx`, `DeviceManagerModal.tsx`).
- **Exports**: Named exports preferred for components. Default export for Pages (`page.tsx`).

### Styling (Tailwind CSS)
- **Primary Color**: `primary-500` (#09b2ac) is the brand color. Use the `primary-*` scale.
- **Dark Mode**:
  - Implementation: Class-based (`darkMode: 'class'`).
  - Palette: `dark-*` custom scale (e.g., `bg-dark-300` for sidebar, `bg-dark-400` for main bg).
  - Rule: **Always** implement dark mode variants for every UI element (e.g., `text-slate-900 dark:text-white`).
- **Glassmorphism**: Use `backdrop-blur` and semi-transparent backgrounds for modals and floating elements.
- **Gradients**: Use text gradients for headers (`bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-700`).

## 4. Specific Implementation Guidelines

### Data Fetching (Supabase)
- **Client-Side**: Use `supabase` from `@/lib/supabase`.
- **Server-Side**: Use utils that utilize `@supabase/ssr` cookies methods in Server Actions or API routes.
- **Auth**: Check session using `supabase.auth.getSession()`.
- **Pattern**:
  ```typescript
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;
  ```

### Naming Conventions
- **Files**:
  - Components: `PascalCase.tsx`
  - Lib/Utils: `camelCase.ts`
  - Routes: `kebab-case` (folder names)
- **Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`

### UI Patterns
- **Sidebar**: Fixed/Sticky sidebar with `Sidebar.tsx`. Handles responsive mobile menu.
- **Modals**: Fixed inset with `z-50`, backdrop blur, and specific border radius (`rounded-[2.5rem]`).
- **Cards**: consistent padding, rounded corners (xl/2xl), and subtle borders (`border-slate-200 dark:border-white/5`).

## 5. Critical Files & Configuration
- **Tailwind Config**: `tailwind.config.ts` defines the `primary` and `dark` color extensions.
- **Env Variables**: Access via `process.env.NEXT_PUBLIC_*` for client-side.
- **Supabase Lib**: `lib/supabase.ts` handles client initialization and singleton pattern.

---
*Follow these rules to ensure consistency with the existing codebase architecture.*
