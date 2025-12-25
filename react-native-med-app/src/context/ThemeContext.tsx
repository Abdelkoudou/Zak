// ============================================================================
// Theme Context - Dark Mode Support
// ============================================================================

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ============================================================================
// Types
// ============================================================================

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeColors {
  // Backgrounds
  background: string
  backgroundSecondary: string
  card: string
  cardElevated: string
  
  // Text
  text: string
  textSecondary: string
  textMuted: string
  textInverse: string
  
  // Primary brand colors
  primary: string
  primaryLight: string
  primaryDark: string
  primaryMuted: string
  
  // Borders
  border: string
  borderLight: string
  
  // Status colors
  success: string
  successLight: string
  error: string
  errorLight: string
  warning: string
  warningLight: string
  
  // Misc
  overlay: string
  skeleton: string
}

interface ThemeContextType {
  mode: ThemeMode
  isDark: boolean
  colors: ThemeColors
  setMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}

// ============================================================================
// Color Palettes
// ============================================================================

// Light Sea Green brand palette
const BRAND = {
  primary50: '#f0fdfa',
  primary100: '#ccfbf1',
  primary200: '#99f6e4',
  primary300: '#5eead4',
  primary400: '#2dd4bf',
  primary500: '#09b2ac', // Main brand color
  primary600: '#0d9488',
  primary700: '#0f766e',
  primary800: '#115e59',
  primary900: '#134e4a',
}

// Light theme colors
const lightColors: ThemeColors = {
  // Backgrounds
  background: '#f9fafb',
  backgroundSecondary: '#f3f4f6',
  card: '#ffffff',
  cardElevated: '#ffffff',
  
  // Text
  text: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textInverse: '#ffffff',
  
  // Primary
  primary: BRAND.primary500,
  primaryLight: BRAND.primary100,
  primaryDark: BRAND.primary700,
  primaryMuted: BRAND.primary50,
  
  // Borders
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  
  // Status
  success: '#22c55e',
  successLight: '#dcfce7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  
  // Misc
  overlay: 'rgba(0, 0, 0, 0.5)',
  skeleton: '#e5e7eb',
}

// Dark theme colors (Eerie Black palette)
const darkColors: ThemeColors = {
  // Backgrounds
  background: '#1f1f1f',
  backgroundSecondary: '#262626',
  card: '#2a2a2a',
  cardElevated: '#333333',
  
  // Text
  text: '#f9fafb',
  textSecondary: '#d1d5db',
  textMuted: '#9ca3af',
  textInverse: '#111827',
  
  // Primary (slightly brighter for dark mode)
  primary: '#14b8a6',
  primaryLight: 'rgba(20, 184, 166, 0.15)',
  primaryDark: '#0d9488',
  primaryMuted: 'rgba(20, 184, 166, 0.1)',
  
  // Borders
  border: '#404040',
  borderLight: '#333333',
  
  // Status
  success: '#34d399',
  successLight: 'rgba(52, 211, 153, 0.15)',
  error: '#f87171',
  errorLight: 'rgba(248, 113, 113, 0.15)',
  warning: '#fbbf24',
  warningLight: 'rgba(251, 191, 36, 0.15)',
  
  // Misc
  overlay: 'rgba(0, 0, 0, 0.7)',
  skeleton: '#404040',
}

// ============================================================================
// Context
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = '@fmc_theme_mode'

// ============================================================================
// Provider
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme()
  const [mode, setModeState] = useState<ThemeMode>('light') // Default to light
  const [isLoaded, setIsLoaded] = useState(false)

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY)
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setModeState(savedMode as ThemeMode)
        }
      } catch {
        // Use default
      } finally {
        setIsLoaded(true)
      }
    }
    loadTheme()
  }, [])

  // Determine if dark mode is active
  const isDark = useMemo(() => {
    if (mode === 'system') {
      return systemColorScheme === 'dark'
    }
    return mode === 'dark'
  }, [mode, systemColorScheme])

  // Get current colors
  const colors = useMemo(() => {
    return isDark ? darkColors : lightColors
  }, [isDark])

  // Set theme mode
  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode)
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode)
    } catch {
      // Storage error silently handled
    }
  }

  // Toggle between light and dark
  const toggleTheme = () => {
    const newMode: ThemeMode = isDark ? 'light' : 'dark'
    setMode(newMode)
  }

  const value: ThemeContextType = {
    mode,
    isDark,
    colors,
    setMode,
    toggleTheme,
  }

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return null
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  
  return context
}

// Export color palettes for direct access if needed
export { lightColors, darkColors, BRAND }
export type { ThemeColors, ThemeMode }
