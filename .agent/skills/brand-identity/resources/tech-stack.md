# Preferred Tech Stack & Implementation Rules

When generating code or UI components for **FMC App**, you **MUST** strictly adhere to the following technology choices.

---

## Core Stack

* **Framework:** React / React Native (TypeScript strictly required)
* **Styling Engine:** 
  - Web: Tailwind CSS
  - Mobile: NativeWind (Tailwind for React Native)
* **Component Library:** shadcn/ui (Use these primitives as the base for all new components)
* **Icons:** Lucide React (Web) / Lucide React Native (Mobile)
* **Backend:** Supabase (Auth, Database, Storage, Realtime)

---

## Brand Color Implementation

Map the brand colors from `design-tokens.json` to your styling:

```css
/* Tailwind CSS Custom Colors */
--color-primary: #09b2ac;       /* Light Green Sea */
--color-secondary: #9941ff;     /* Veronica */
--color-background: #f8f2e8;    /* Floral White */
--color-foreground: #262626;    /* Eerie Black */
```

---

## Typography Implementation

### Font Loading
Load the following fonts from Google Fonts:

```html
<!-- Latin: Manrope (Primary), Inter (Fallback) -->
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">

<!-- Latin & Arabic: Cairo -->
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
```

### Font Stacks
```css
--font-heading: 'Manrope', 'Inter', sans-serif;
--font-body: 'Cairo', 'Roboto', sans-serif;
--font-arabic: 'Cairo', 'Tahoma', sans-serif;
```

---

## Implementation Guidelines

### 1. Tailwind Usage
* Use utility classes directly in JSX.
* Utilize the color tokens defined in `design-tokens.json` (e.g., use `bg-primary text-primary-foreground` instead of hardcoded hex values).
* **Dark Mode:** Support dark mode using Tailwind's `dark:` variant modifier.
* **Eerie Black (#262626)** as the dark mode background.

### 2. Component Patterns
* **Buttons:** Primary actions must use the Light Green Sea (`#09b2ac`) color. Secondary actions use Veronica (`#9941ff`) or a 'Ghost'/'Outline' variant.
* **Forms:** Labels must always be placed *above* input fields. Use standard Tailwind spacing (e.g., `gap-4` between form items).
* **Layout:** Use Flexbox and CSS Grid via Tailwind utilities for all layout structures.
* **Cards:** Use Floral White (`#f8f2e8`) as the default card background in light mode.

### 3. Color Pairings (Approved Combinations)
| Background | Foreground | Use Case |
|:---|:---|:---|
| Eerie Black `#262626` | Light Green Sea `#09b2ac` | Headers, CTAs |
| Veronica `#9941ff` | Floral White `#f8f2e8` | Accent sections |
| Floral White `#f8f2e8` | Eerie Black `#262626` | Content areas |
| Light Green Sea `#09b2ac` | Black/White | Logo presentations |

### 4. Forbidden Patterns
* ❌ Do NOT use jQuery.
* ❌ Do NOT use Bootstrap classes.
* ❌ Do NOT create new CSS files; keep styles within component files via Tailwind.
* ❌ Do NOT use colors outside the approved brand palette without explicit permission.
* ❌ Do NOT add drop shadows, glows, or gradients to the logo.
