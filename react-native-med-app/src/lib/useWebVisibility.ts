// ============================================================================
// Web Visibility Hook - Handle browser tab visibility changes
// Crash-Safe Implementation with Lazy Loading
// ============================================================================

import { useEffect, useState, useRef, useCallback } from 'react'

// Lazy-loaded modules to prevent crashes
let _Platform: typeof import('react-native').Platform | null = null
let _AppState: typeof import('react-native').AppState | null = null
let _modulesLoaded = false

function loadModules() {
  if (_modulesLoaded) return
  _modulesLoaded = true
  
  try {
    const RN = require('react-native')
    _Platform = RN.Platform
    _AppState = RN.AppState
  } catch (error) {
    if (__DEV__) {
      console.warn('[useWebVisibility] Failed to load react-native:', error)
    }
  }
}

function getPlatformOS(): string {
  loadModules()
  return _Platform?.OS || 'unknown'
}

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
  
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastHiddenAtRef = useRef<number | null>(null)
  const onVisibilityChangeRef = useRef(onVisibilityChange)
  
  // Keep callback ref updated
  useEffect(() => {
    onVisibilityChangeRef.current = onVisibilityChange
  }, [onVisibilityChange])

  useEffect(() => {
    const platformOS = getPlatformOS()
    
    if (platformOS === 'web' && typeof document !== 'undefined') {
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
    } else if (platformOS !== 'unknown') {
      // Native: Use AppState (lazy loaded)
      loadModules()
      
      if (!_AppState) {
        // AppState not available, return early
        return
      }
      
      const handleAppStateChange = (nextAppState: string) => {
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

      try {
        const subscription = _AppState.addEventListener('change', handleAppStateChange)
        
        return () => {
          subscription?.remove()
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[useWebVisibility] Failed to add AppState listener:', error)
        }
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
