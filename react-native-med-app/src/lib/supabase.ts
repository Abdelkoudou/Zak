// ============================================================================
// Supabase Client Configuration - Completely Lazy & Crash-Safe
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Lazy-loaded Platform to prevent crashes
let _Platform: typeof import('react-native').Platform | null = null
let _platformLoaded = false

function getPlatform() {
  if (!_platformLoaded) {
    _platformLoaded = true
    try {
      _Platform = require('react-native').Platform
    } catch {
      _Platform = null
    }
  }
  return _Platform
}

// URL polyfill state
let _urlPolyfillLoaded = false

function ensureUrlPolyfill() {
  if (_urlPolyfillLoaded) return
  _urlPolyfillLoaded = true
  
  try {
    const platform = getPlatform()
    if (platform && platform.OS !== 'web') {
      require('react-native-url-polyfill/auto')
    }
  } catch (error) {
    // Silent fail - URL polyfill might not be needed
    if (__DEV__) {
      console.warn('[Supabase] URL polyfill failed:', error)
    }
  }
}

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

// Check platform safely
function isWeb(): boolean {
  const platform = getPlatform()
  return platform?.OS === 'web'
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// For web: Use localStorage directly
function getWebStorage() {
  if (!isBrowser()) return undefined
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

// For native: Use AsyncStorage with error handling
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

// Create the redirect URL for deep linking
export const getRedirectUrl = (path: string = 'auth/callback') => {
  const platform = getPlatform()
  
  if (platform?.OS === 'web') {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin.trim()
      const cleanPath = path.trim().replace(/^\//, '')
      return `${origin}/${cleanPath}`
    }
    return `/${path.trim()}`
  }
  
  try {
    const Linking = require('expo-linking')
    return Linking.createURL(path.trim())
  } catch {
    return path
  }
}

// Supabase client - truly lazy singleton
let _supabaseInstance: SupabaseClient | null = null

function createSupabaseClient(): SupabaseClient {
  // Ensure URL polyfill is loaded before creating client
  ensureUrlPolyfill()
  
  const web = isWeb()
  const storage = web ? getWebStorage() : nativeStorage
  
  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storageKey: 'sb-auth-token',
        flowType: web ? 'pkce' : 'implicit',
      },
      global: {
        headers: {
          'x-client-info': `fmc-app/${getPlatform()?.OS || 'unknown'}`,
        },
      },
    })
  } catch (error) {
    if (__DEV__) {
      console.error('[Supabase] Failed to create client:', error)
    }
    // Create a minimal fallback client
    return createClient('https://placeholder.supabase.co', 'placeholder', {
      auth: { storage: nativeStorage, persistSession: false }
    })
  }
}

// Getter function for lazy initialization
function getSupabase(): SupabaseClient {
  if (!_supabaseInstance) {
    _supabaseInstance = createSupabaseClient()
  }
  return _supabaseInstance
}

// Export as a proxy that lazily initializes
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabase()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})

// Helper function to ensure session is valid
export async function ensureValidSession(): Promise<boolean> {
  try {
    const client = getSupabase()
    const { data: { session }, error } = await client.auth.getSession()
    if (error || !session) return false
    
    const expiresAt = session.expires_at
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000)
      if (expiresAt - now < 60) {
        const { error: refreshError } = await client.auth.refreshSession()
        if (refreshError) return false
      }
    }
    return true
  } catch {
    return false
  }
}

// Helper to get session synchronously from localStorage on web
export function getStoredSessionSync(): boolean {
  if (!isWeb() || !isBrowser()) return false
  try {
    const stored = window.localStorage.getItem('sb-auth-token')
    return stored !== null && stored !== ''
  } catch {
    return false
  }
}

export default supabase
