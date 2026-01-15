// ============================================================================
// Theme Context - Dark Mode Support (Crash-Safe)
// ============================================================================

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Lazy-loaded useColorScheme to prevent crashes
let _useColorScheme: typeof import('react-native').useColorScheme | null = null
let _hookLoaded = false

function getUseColorScheme() {
  if (!_hookLoaded) {
    _hookLoaded = true
    try {
      _useColorScheme = require('react-native').useColorScheme
    } catch {
      _useColorScheme = null
    }
  }
  return _useColorScheme
}

// Safe wrapper for useColorScheme
function useSafeColorScheme(): 'light' | 'dark' | null | undefined {
  const [scheme, setScheme] = useState<'light' | 'dark' | null | undefined>('light')
  
  useEffect(() => {
    try {
      const hook = getUseColorScheme()
      if (hook) {
        // We can't call hooks conditionally, so we use a workaround
        // The actual hook is called in the component that uses this
      }
    } catch {
      // Silent fail
    }
  }, [])
  
  return scheme
}

// ============================================================================
// Types
// ============================================================================

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeColors {
  background: string
  backgroundSecondary: string
  card: string
  cardElevated: string
  text: string
  textSecondary: string
  textMuted: string
  textInverse: string
  primary: string
  primaryLight: string
  primaryDark: string
  primaryMuted: string
  border: string
  borderLight: string
  success: string
  successLight: string
  error: string
  errorLight: string
  warning: string
  warningLight: string
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

const BRAND = {
  primary50: '#f0fdfa',
  primary100: '#ccfbf1',
  primary200: '#99f6e4',
  primary300: '#5eead4',
  primary400: '#2dd4bf',
  primary500: '#09b2ac',
  primary600: '#0d9488',
  primary700: '#0f766e',
  primary800: '#115e59',
  primary900: '#134e4a',
}

const lightColors: ThemeColors = {
  background: '#f9fafb',
  backgroundSecondary: '#f3f4f6',
  card: '#ffffff',
  cardElevated: '#ffffff',
  text: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textInverse: '#ffffff',
  primary: BRAND.primary500,
  primaryLight: BRAND.primary100,
  primaryDark: BRAND.primary700,
  primaryMuted: BRAND.primary50,
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  success: '#22c55e',
  successLight: '#dcfce7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  overlay: 'rgba(0, 0, 0, 0.5)',
  skeleton: '#e5e7eb',
}

const darkColors: ThemeColors = {
  background: '#1f1f1f',
  backgroundSecondary: '#262626',
  card: '#2a2a2a',
  cardElevated: '#333333',
  text: '#f9fafb',
  textSecondary: '#d1d5db',
  textMuted: '#9ca3af',
  textInverse: '#111827',
  primary: '#14b8a6',
  primaryLight: 'rgba(20, 184, 166, 0.15)',
  primaryDark: '#0d9488',
  primaryMuted: 'rgba(20, 184, 166, 0.1)',
  border: '#404040',
  borderLight: '#333333',
  success: '#34d399',
  successLight: 'rgba(52, 211, 153, 0.15)',
  error: '#f87171',
  errorLight: 'rgba(248, 113, 113, 0.15)',
  warning: '#fbbf24',
  warningLight: 'rgba(251, 191, 36, 0.15)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  skeleton: '#404040',
}

// ============================================================================
// Context
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = '@fmc_theme_mode'

// ============================================================================
// Inner component that safely uses useColorScheme
// ============================================================================

function ThemeProviderInner({ children, mode, setModeState }: {
  children: ReactNode
  mode: ThemeMode
  setModeState: (mode: ThemeMode) => void
}) {
  // Try to use the native hook safely
  let systemColorScheme: 'light' | 'dark' | null | undefined = 'light'
  
  try {
    const hook = getUseColorScheme()
    if (hook) {
      // This is safe because we're inside a component
      systemColorScheme = hook()
    }
  } catch {
    systemColorScheme = 'light'
  }

  const isDark = useMemo(() => {
    if (mode === 'system') {
      return systemColorScheme === 'dark'
    }
    return mode === 'dark'
  }, [mode, systemColorScheme])

  const colors = useMemo(() => {
    return isDark ? darkColors : lightColors
  }, [isDark])

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode)
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode)
    } catch {
      // Silent fail
    }
  }

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

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// ============================================================================
// Provider
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>('light')
  const [isLoaded, setIsLoaded] = useState(false)

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

  return (
    <ThemeProviderInner mode={mode} setModeState={setModeState}>
      {children}
    </ThemeProviderInner>
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

export { lightColors, darkColors, BRAND }
export type { ThemeColors, ThemeMode }
