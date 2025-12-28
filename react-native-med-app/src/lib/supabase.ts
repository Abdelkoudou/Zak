// ============================================================================
// Supabase Client Configuration
// ============================================================================

import 'react-native-url-polyfill/auto'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if we're in a browser/native environment (not SSR)
const isClient = typeof window !== 'undefined' || Platform.OS !== 'web'
const isWeb = Platform.OS === 'web'

// Create a custom storage adapter that handles SSR and optimizes for web/native
// IMPORTANT: On web, we use localStorage which is synchronous
// This prevents issues with async storage when the tab regains focus
const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (!isClient) return null
    if (isWeb && typeof window !== 'undefined') {
      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    }
    try {
      return await AsyncStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (!isClient) return
    if (isWeb && typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, value)
      } catch {
        // Ignore storage errors
      }
      return
    }
    try {
      await AsyncStorage.setItem(key, value)
    } catch {
      // Ignore storage errors
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (!isClient) return
    if (isWeb && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key)
      } catch {
        // Ignore storage errors
      }
      return
    }
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

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb, // Enable on web to handle OAuth callbacks
    // On web, use a shorter storage key to avoid issues
    storageKey: isWeb ? 'sb-auth-token' : undefined,
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
          return false
        }
      }
    }
    
    return true
  } catch {
    return false
  }
}

export default supabase
