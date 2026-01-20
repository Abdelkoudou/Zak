// ============================================================================
// MCQ Study App - Brand Theme
// ============================================================================

/**
 * Light Sea Green Brand Palette
 * Primary color: #0fb2ac (Light Sea Green)
 * 
 * Color values from the provided palette:
 * - #2df4ed (Lightest)
 * - #0fa3db (Light)
 * - #07b17d (Medium)
 * - #04514e (Dark)
 * - #02201f (Darkest)
 */

export const BRAND_THEME = {
  // Primary brand colors based on Light Sea Green palette
  colors: {
    primary: {
      50: '#f0fdfa',    // Very light tint for backgrounds
      100: '#ccfbf1',   // Light tint for subtle backgrounds
      200: '#99f6e4',   // Lighter for hover states
      300: '#5eead4',   // Light for disabled states
      400: '#2dd4bf',   // Medium light for secondary actions
      500: '#14b8a6',   // Base brand color (main primary)
      600: '#0d9488',   // Medium dark for hover states
      700: '#0f766e',   // Dark for active states
      800: '#115e59',   // Darker for text on light backgrounds
      900: '#134e4a',   // Darkest for high contrast text
    },

    // Semantic colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
    },

    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
    },

    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
    },

    // Neutral grays
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },

  // Typography scale
  typography: {
    fontSizes: {
      xs: 14,
      sm: 16,
      base: 18,
      lg: 20,
      xl: 24,
      '2xl': 30,
      '3xl': 36,
      '4xl': 42,
    },

    fontWeights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },

    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing scale
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },

  // Border radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  // Shadows
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
} as const

// Component-specific theme tokens
export const COMPONENT_THEMES = {
  // Button variants
  button: {
    primary: {
      background: BRAND_THEME.colors.primary[500],
      backgroundHover: BRAND_THEME.colors.primary[600],
      backgroundActive: BRAND_THEME.colors.primary[700],
      text: '#ffffff',
    },
    secondary: {
      background: BRAND_THEME.colors.primary[100],
      backgroundHover: BRAND_THEME.colors.primary[200],
      backgroundActive: BRAND_THEME.colors.primary[300],
      text: BRAND_THEME.colors.primary[800],
    },
    outline: {
      background: 'transparent',
      border: BRAND_THEME.colors.primary[500],
      borderHover: BRAND_THEME.colors.primary[600],
      text: BRAND_THEME.colors.primary[600],
      textHover: BRAND_THEME.colors.primary[700],
    },
  },

  // Card variants
  card: {
    default: {
      background: '#ffffff',
      border: BRAND_THEME.colors.gray[200],
      shadow: BRAND_THEME.shadows.sm,
    },
    elevated: {
      background: '#ffffff',
      border: 'transparent',
      shadow: BRAND_THEME.shadows.md,
    },
  },

  // Input variants
  input: {
    default: {
      background: '#ffffff',
      border: BRAND_THEME.colors.gray[300],
      borderFocus: BRAND_THEME.colors.primary[500],
      text: BRAND_THEME.colors.gray[900],
      placeholder: BRAND_THEME.colors.gray[500],
    },
  },
} as const

// Export individual color palettes for convenience
export const PRIMARY_COLORS = BRAND_THEME.colors.primary
export const SUCCESS_COLORS = BRAND_THEME.colors.success
export const ERROR_COLORS = BRAND_THEME.colors.error
export const WARNING_COLORS = BRAND_THEME.colors.warning
export const GRAY_COLORS = BRAND_THEME.colors.gray