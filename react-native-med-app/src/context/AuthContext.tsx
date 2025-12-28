// ============================================================================
// Authentication Context
// ============================================================================

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, RegisterFormData, ProfileUpdateData } from '@/types'
import * as authService from '@/lib/auth'
import { supabase } from '@/lib/supabase'

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

  // Check for existing session on mount
  useEffect(() => {
    let isMounted = true
    
    // Safety timeout: ensure loading state is cleared after 5 seconds
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false)
      }
    }, 5000)

    const init = async () => {
      await checkSession()
      if (isMounted) {
        clearTimeout(safetyTimeout)
      }
    }

    init()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        if (event === 'SIGNED_IN' && session) {
          await refreshUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setIsLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  // Check for existing session
  const checkSession = async () => {
    try {
      // Don't set isLoading(true) here if it's already true from initial state
      // This avoids unnecessary re-renders during mount
      const { user: currentUser } = await authService.getCurrentUser()
      setUser(currentUser)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh user data
  const refreshUser = async () => {
    try {
      const { user: currentUser } = await authService.getCurrentUser()
      setUser(currentUser)
    } catch {
      // Error refreshing user silently handled
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
