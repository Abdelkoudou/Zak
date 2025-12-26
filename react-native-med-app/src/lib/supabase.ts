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

// Create a custom storage adapter that handles SSR
const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (!isClient) return null
    try {
      return await AsyncStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (!isClient) return
    try {
      await AsyncStorage.setItem(key, value)
    } catch {
      // Ignore storage errors during SSR
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (!isClient) return
    try {
      await AsyncStorage.removeItem(key)
    } catch {
      // Ignore storage errors during SSR
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
    autoRefreshToken: isClient,
    persistSession: isClient,
    detectSessionInUrl: false,
  },
})

export default supabase
