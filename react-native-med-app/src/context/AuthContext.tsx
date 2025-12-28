// ============================================================================
// Authentication Context
// ============================================================================

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react'
import { Platform } from 'react-native'
import { User, RegisterFormData, ProfileUpdateData } from '@/types'
import * as authService from '@/lib/auth'
import { supabase, ensureValidSession } from '@/lib/supabase'
import { useWebVisibility } from '@/lib/useWebVisibility'

// ============================================================================
// Types
// ============================================================================

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signUp: (data: RegisterFormData) => Promise<{ error: string | null; needsEmailVerification?: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<{ error: string | null }>
  updateProfile: (data: ProfileUpdateData) => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  refreshUser: () => Promise<void>
  getDeviceSessions: () => Promise<{ sessions: any[]; error: string | null }>
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================================================
// Provider
// ============================================================================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Track if we're currently checking session to prevent duplicate calls
  const isCheckingSession = useRef(false)
  // Track last successful session check time
  const lastSessionCheck = useRef<number>(0)
  // Minimum time between session checks (5 seconds for web, 30 seconds for native)
  const SESSION_CHECK_COOLDOWN = Platform.OS === 'web' ? 5000 : 30000
  // Track if initial load is complete
  const initialLoadComplete = useRef(false)

  // Check for existing session on mount
  useEffect(() => {
    let isMounted = true
    
    // Safety timeout: ensure loading state is cleared after 5 seconds
    const safetyTimeout = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn('[Auth] Safety timeout triggered - forcing loading state to false')
        setIsLoading(false)
        initialLoadComplete.current = true
      }
    }, 5000)

    const init = async () => {
      try {
        await checkSession()
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimeout)
          initialLoadComplete.current = true
        }
      }
    }

    init()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        
        console.log('[Auth] Auth state changed:', event)

        if (event === 'SIGNED_IN' && session) {
          await refreshUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setIsLoading(false)
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Token was refreshed, ensure user data is still valid
          console.log('[Auth] Token refreshed')
        }
      }
    )

    return () => {
      isMounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  // Handle visibility changes - CRITICAL for web tab switching
  const handleVisibilityChange = useCallback(async (isVisible: boolean, hiddenDuration: number) => {
    // Only handle when becoming visible
    if (!isVisible) return
    
    // Always try to recover session on web when tab becomes visible
    // This is critical for fixing the "infinite loading" issue
    if (Platform.OS === 'web' && initialLoadComplete.current) {
      // Skip if we checked very recently (within 2 seconds)
      const timeSinceLastCheck = Date.now() - lastSessionCheck.current
      if (timeSinceLastCheck < 2000) return
      
      // Skip if already checking
      if (isCheckingSession.current) return
      
      console.log('[Auth] Tab became visible, checking session...', { hiddenDuration })
      
      try {
        isCheckingSession.current = true
        
        // First, ensure the Supabase session is valid
        const isValid = await ensureValidSession()
        
        if (!isValid && user) {
          // Session is invalid but we have a user - this is the bug!
          // The session was lost while the tab was hidden
          console.warn('[Auth] Session invalid but user exists - attempting recovery')
          
          // Try to get a fresh session
          const { data: { session } } = await supabase.auth.getSession()
          
          if (!session) {
            // Session is truly gone - user needs to re-login
            console.warn('[Auth] Session recovery failed - user must re-login')
            setUser(null)
          } else {
            // Session exists, refresh user data
            await refreshUser()
          }
        } else if (isValid && user) {
          // Session is valid, optionally refresh user data if hidden for a while
          if (hiddenDuration > 60000) {
            await refreshUser()
          }
        }
        
        lastSessionCheck.current = Date.now()
      } catch (error) {
        console.error('[Auth] Error during visibility change handling:', error)
      } finally {
        isCheckingSession.current = false
      }
    }
  }, [user])

  // Use the web visibility hook for proper tab visibility handling
  useWebVisibility({
    debounceMs: 100, // Quick response for better UX
    onVisibilityChange: handleVisibilityChange,
  })

  // Check for existing session
  const checkSession = async () => {
    if (isCheckingSession.current) return
    
    try {
      isCheckingSession.current = true
      const { user: currentUser } = await authService.getCurrentUser()
      setUser(currentUser)
      lastSessionCheck.current = Date.now()
    } catch (error) {
      console.error('[Auth] Error checking session:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
      isCheckingSession.current = false
    }
  }

  // Refresh user data
  const refreshUser = async () => {
    try {
      const { user: currentUser } = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('[Auth] Error refreshing user:', error)
    }
  }

  // Sign up
  const signUp = async (data: RegisterFormData): Promise<{ error: string | null; needsEmailVerification?: boolean }> => {
    try {
      setIsLoading(true)
      const { user: newUser, error, needsEmailVerification } = await authService.signUp(data)
      
      if (error) {
        return { error }
      }

      if (needsEmailVerification) {
        return { error: null, needsEmailVerification: true }
      }

      setUser(newUser)
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign in
  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      setIsLoading(true)
      const { user: loggedInUser, error } = await authService.signIn(email, password)
      
      if (error) {
        return { error }
      }

      setUser(loggedInUser)
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign out
  const signOut = async (): Promise<{ error: string | null }> => {
    try {
      setIsLoading(true)
      const { error } = await authService.signOut()
      
      if (error) {
        return { error }
      }

      setUser(null)
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    } finally {
      setIsLoading(false)
    }
  }

  // Update profile
  const updateProfile = async (data: ProfileUpdateData): Promise<{ error: string | null }> => {
    if (!user) {
      return { error: 'Not authenticated' }
    }

    try {
      const { user: updatedUser, error } = await authService.updateProfile(user.id, data)
      
      if (error) {
        return { error }
      }

      setUser(updatedUser)
      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  }

  // Reset password
  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    return authService.resetPassword(email)
  }

  // Get device sessions
  const getDeviceSessions = async (): Promise<{ sessions: any[]; error: string | null }> => {
    if (!user) {
      return { sessions: [], error: 'Not authenticated' }
    }
    return authService.getDeviceSessions(user.id)
  }

  // Context value
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    refreshUser,
    getDeviceSessions,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

export default AuthContext
