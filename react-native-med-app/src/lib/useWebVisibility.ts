// ============================================================================
// Web Visibility Hook - Handle browser tab visibility changes
// ============================================================================

import { useEffect, useState, useRef, useCallback } from 'react'
import { Platform, AppState, AppStateStatus } from 'react-native'

interface VisibilityState {
  isVisible: boolean
  lastHiddenAt: number | null
  lastVisibleAt: number | null
  hiddenDuration: number
}

interface UseWebVisibilityOptions {
  /** Debounce delay in ms before reporting visibility change (default: 100) */
  debounceMs?: number
  /** Callback when visibility changes */
  onVisibilityChange?: (isVisible: boolean, hiddenDuration: number) => void
}

/**
 * Hook to handle browser tab visibility changes on web
 * and AppState changes on native platforms.
 * 
 * This hook provides debounced visibility state to prevent
 * rapid firing of callbacks when switching tabs quickly.
 */
export function useWebVisibility(options: UseWebVisibilityOptions = {}) {
  const { debounceMs = 100, onVisibilityChange } = options
  
  const [state, setState] = useState<VisibilityState>({
    isVisible: true,
    lastHiddenAt: null,
    lastVisibleAt: Date.now(),
    hiddenDuration: 0,
  })
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const lastHiddenAtRef = useRef<number | null>(null)
  const onVisibilityChangeRef = useRef(onVisibilityChange)
  
  // Keep callback ref updated
  useEffect(() => {
    onVisibilityChangeRef.current = onVisibilityChange
  }, [onVisibilityChange])

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Web: Use Page Visibility API
      const handleVisibilityChange = () => {
        const isNowVisible = !document.hidden
        
        // Clear any pending debounce
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current)
        }
        
        // Debounce the state update
        debounceTimer.current = setTimeout(() => {
          const now = Date.now()
          
          if (isNowVisible) {
            // Tab became visible
            const hiddenDuration = lastHiddenAtRef.current 
              ? now - lastHiddenAtRef.current 
              : 0
            
            setState({
              isVisible: true,
              lastHiddenAt: lastHiddenAtRef.current,
              lastVisibleAt: now,
              hiddenDuration,
            })
            
            onVisibilityChangeRef.current?.(true, hiddenDuration)
          } else {
            // Tab became hidden
            lastHiddenAtRef.current = now
            
            setState(prev => ({
              ...prev,
              isVisible: false,
              lastHiddenAt: now,
              hiddenDuration: 0,
            }))
            
            onVisibilityChangeRef.current?.(false, 0)
          }
        }, debounceMs)
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      // Also handle window focus/blur for additional reliability
      const handleFocus = () => {
        if (!document.hidden) {
          handleVisibilityChange()
        }
      }
      
      const handleBlur = () => {
        // Only trigger if document is actually hidden
        // (blur can fire when clicking into devtools, etc.)
        setTimeout(() => {
          if (document.hidden) {
            handleVisibilityChange()
          }
        }, 50)
      }
      
      window.addEventListener('focus', handleFocus)
      window.addEventListener('blur', handleBlur)

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('focus', handleFocus)
        window.removeEventListener('blur', handleBlur)
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current)
        }
      }
    } else {
      // Native: Use AppState
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        const isNowVisible = nextAppState === 'active'
        const now = Date.now()
        
        if (isNowVisible) {
          const hiddenDuration = lastHiddenAtRef.current 
            ? now - lastHiddenAtRef.current 
            : 0
          
          setState({
            isVisible: true,
            lastHiddenAt: lastHiddenAtRef.current,
            lastVisibleAt: now,
            hiddenDuration,
          })
          
          onVisibilityChangeRef.current?.(true, hiddenDuration)
        } else {
          lastHiddenAtRef.current = now
          
          setState(prev => ({
            ...prev,
            isVisible: false,
            lastHiddenAt: now,
            hiddenDuration: 0,
          }))
          
          onVisibilityChangeRef.current?.(false, 0)
        }
      }

      const subscription = AppState.addEventListener('change', handleAppStateChange)
      
      return () => {
        subscription.remove()
      }
    }
  }, [debounceMs])

  /**
   * Check if the app was hidden for longer than the specified duration
   */
  const wasHiddenForMoreThan = useCallback((ms: number): boolean => {
    return state.hiddenDuration > ms
  }, [state.hiddenDuration])

  return {
    ...state,
    wasHiddenForMoreThan,
  }
}

export default useWebVisibility
