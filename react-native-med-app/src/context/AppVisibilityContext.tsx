// ============================================================================
// App Visibility Context - Global visibility state management
// ============================================================================

import React, { createContext, useContext, useRef, useCallback, ReactNode } from 'react'
import { useWebVisibility } from '@/lib/useWebVisibility'

// ============================================================================
// Types
// ============================================================================

interface AppVisibilityContextType {
  /** Whether the app/tab is currently visible */
  isVisible: boolean
  /** Timestamp when the app was last hidden (null if never hidden) */
  lastHiddenAt: number | null
  /** Timestamp when the app last became visible */
  lastVisibleAt: number | null
  /** Duration in ms that the app was hidden before becoming visible */
  hiddenDuration: number
  /** Check if app was hidden for more than specified ms */
  wasHiddenForMoreThan: (ms: number) => boolean
  /** Check if this is a "fresh" visibility (hidden for less than threshold) */
  isFreshVisibility: (thresholdMs?: number) => boolean
  /** Get a stable key that changes only on significant visibility changes */
  getVisibilityKey: () => string
}

// ============================================================================
// Context
// ============================================================================

const AppVisibilityContext = createContext<AppVisibilityContextType | undefined>(undefined)

// ============================================================================
// Provider
// ============================================================================

interface AppVisibilityProviderProps {
  children: ReactNode
  /** Threshold in ms to consider a visibility change "significant" (default: 5000) */
  significantHiddenThreshold?: number
}

export function AppVisibilityProvider({ 
  children, 
  significantHiddenThreshold = 5000 
}: AppVisibilityProviderProps) {
  const visibilityKeyRef = useRef(0)
  const lastSignificantChangeRef = useRef(Date.now())
  
  const handleVisibilityChange = useCallback((isVisible: boolean, hiddenDuration: number) => {
    // Only increment key for significant visibility changes
    // This prevents unnecessary re-renders for quick tab switches
    if (isVisible && hiddenDuration > significantHiddenThreshold) {
      visibilityKeyRef.current += 1
      lastSignificantChangeRef.current = Date.now()
    }
  }, [significantHiddenThreshold])

  const visibility = useWebVisibility({
    debounceMs: 150, // Slightly longer debounce for global state
    onVisibilityChange: handleVisibilityChange,
  })

  const isFreshVisibility = useCallback((thresholdMs = 1000): boolean => {
    // Returns true if we just became visible and weren't hidden for long
    return visibility.isVisible && visibility.hiddenDuration < thresholdMs
  }, [visibility.isVisible, visibility.hiddenDuration])

  const getVisibilityKey = useCallback((): string => {
    return `visibility-${visibilityKeyRef.current}`
  }, [])

  const value: AppVisibilityContextType = {
    ...visibility,
    isFreshVisibility,
    getVisibilityKey,
  }

  return (
    <AppVisibilityContext.Provider value={value}>
      {children}
    </AppVisibilityContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useAppVisibility(): AppVisibilityContextType {
  const context = useContext(AppVisibilityContext)
  
  if (context === undefined) {
    throw new Error('useAppVisibility must be used within an AppVisibilityProvider')
  }
  
  return context
}

// ============================================================================
// Utility Hook: Skip effect on fresh visibility
// ============================================================================

/**
 * Hook that returns whether an effect should be skipped
 * based on visibility state. Useful for preventing
 * unnecessary data fetches on quick tab switches.
 */
export function useShouldSkipOnVisibility(thresholdMs = 2000): boolean {
  const { isFreshVisibility } = useAppVisibility()
  return isFreshVisibility(thresholdMs)
}

export default AppVisibilityContext
