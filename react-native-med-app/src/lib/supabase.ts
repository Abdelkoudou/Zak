// ============================================================================
// Supabase Client Configuration
// ============================================================================

import 'react-native-url-polyfill/auto'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if we're in a browser environment
const isWeb = Platform.OS === 'web'
const isBrowser = typeof window !== 'undefined'

// For web: Use localStorage directly (synchronous) - this is CRITICAL for session persistence
// Supabase expects synchronous storage on web to properly rehydrate sessions on page load
// Using an async wrapper causes race conditions where the session appears empty on refresh
const webStorage = isBrowser ? window.localStorage : undefined

// For native: Use AsyncStorage (async is fine on native)
const nativeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value)
    } catch {
      // Ignore storage errors
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key)
    } catch {
      // Ignore storage errors
    }
  },
}

// Create the redirect URL for deep linking (lazy load expo-linking)
export const getRedirectUrl = () => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback'
  }
  // Only import expo-linking on native
  const Linking = require('expo-linking')
  return Linking.createURL('auth/callback')
}

// Create Supabase client with platform-specific storage
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // CRITICAL: Use synchronous localStorage on web, async storage on native
    storage: isWeb ? webStorage : nativeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb, // Enable on web to handle OAuth callbacks and page refreshes
    // Use a consistent storage key
    storageKey: 'sb-auth-token',
    // PKCE flow is more secure for web
    flowType: isWeb ? 'pkce' : 'implicit',
  },
  // Add global error handling
  global: {
    headers: {
      'x-client-info': `fmc-app/${Platform.OS}`,
    },
  },
})

// Helper function to ensure session is valid before making requests
export async function ensureValidSession(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session) {
      return false
    }
    
    // Check if token is about to expire (within 60 seconds)
    const expiresAt = session.expires_at
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000)
      if (expiresAt - now < 60) {
        // Token is about to expire, try to refresh
        const { error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          console.warn('[Supabase] Failed to refresh session:', refreshError.message)
          return false
        }
      }
    }
    
    return true
  } catch (error) {
    console.error('[Supabase] Error in ensureValidSession:', error)
    return false
  }
}

// Helper to get session synchronously from localStorage on web (for initial load)
export function getStoredSessionSync(): boolean {
  if (!isWeb || !isBrowser) return false
  try {
    const stored = window.localStorage.getItem('sb-auth-token')
    return stored !== null && stored !== ''
  } catch {
    return false
  }
}

export default supabase
