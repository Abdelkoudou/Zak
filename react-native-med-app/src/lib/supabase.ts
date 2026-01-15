// ============================================================================
// Supabase Client Configuration - Production Ready for Native & Web
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ============================================================================
// Environment Variable Handling
// ============================================================================

function isValidEnvVar(value: string | undefined): boolean {
  if (!value) return false
  if (value.length === 0) return false
  // Check for EAS placeholder strings that weren't resolved
  if (value.startsWith('${') && value.endsWith('}')) return false
  // Check for common placeholder patterns
  if (value === 'undefined' || value === 'null') return false
  return true
}

// Get environment variables - these MUST be set in EAS secrets or .env
const supabaseUrl = isValidEnvVar(process.env.EXPO_PUBLIC_SUPABASE_URL) 
  ? process.env.EXPO_PUBLIC_SUPABASE_URL! 
  : ''

const supabaseAnonKey = isValidEnvVar(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)
  ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
  : ''

// Log warning if not configured (only in dev)
if (__DEV__) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] ⚠️ MISSING CONFIGURATION!')
    console.error('[Supabase] Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY')
    console.error('[Supabase] In .env file for local dev, or EAS Secrets for builds')
  } else {
    console.log('[Supabase] ✓ Configuration loaded')
  }
}

// ============================================================================
// Platform Detection - Lazy loaded to prevent crashes
// ============================================================================

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

// ============================================================================
// URL Polyfill - Must be loaded before any network calls on native
// ============================================================================

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
    if (__DEV__) {
      console.warn('[Supabase] URL polyfill failed:', error)
    }
  }
}

// Load URL polyfill immediately for native platforms
ensureUrlPolyfill()

// ============================================================================
// Platform Helpers
// ============================================================================

function isWeb(): boolean {
  const platform = getPlatform()
  return platform?.OS === 'web'
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// ============================================================================
// Storage Configuration
// ============================================================================

function getWebStorage() {
  if (!isBrowser()) return undefined
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

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

// ============================================================================
// Deep Linking / Redirect URL
// ============================================================================

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

// ============================================================================
// Supabase Client - Singleton Pattern
// ============================================================================

let _supabaseInstance: SupabaseClient | null = null

function createSupabaseClient(): SupabaseClient {
  const web = isWeb()
  const storage = web ? getWebStorage() : nativeStorage
  
  if (__DEV__) {
    console.log('[Supabase] Creating client for platform:', getPlatform()?.OS || 'unknown')
  }
  
  // If not configured, create a dummy client that will fail gracefully
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] Cannot create client - missing configuration')
    // Return a client that will fail on any operation
    return createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { storage: nativeStorage, persistSession: false }
    })
  }
  
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
}

function getSupabaseClient(): SupabaseClient {
  if (!_supabaseInstance) {
    _supabaseInstance = createSupabaseClient()
  }
  return _supabaseInstance
}

export const supabase: SupabaseClient = getSupabaseClient()

// ============================================================================
// Helper Functions
// ============================================================================

export async function ensureValidSession(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session) return false
    
    const expiresAt = session.expires_at
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000)
      if (expiresAt - now < 60) {
        const { error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) return false
      }
    }
    return true
  } catch {
    return false
  }
}

export function getStoredSessionSync(): boolean {
  if (!isWeb() || !isBrowser()) return false
  try {
    const stored = window.localStorage.getItem('sb-auth-token')
    return stored !== null && stored !== ''
  } catch {
    return false
  }
}

export function isSupabaseConfigured(): boolean {
  return supabaseUrl.length > 0 && 
         supabaseAnonKey.length > 0 && 
         supabaseUrl.includes('supabase') &&
         supabaseAnonKey.startsWith('eyJ')
}

export function getSupabaseConfigStatus(): { url: boolean; key: boolean; valid: boolean } {
  return {
    url: supabaseUrl.length > 0 && supabaseUrl.includes('supabase'),
    key: supabaseAnonKey.length > 0 && supabaseAnonKey.startsWith('eyJ'),
    valid: isSupabaseConfigured()
  }
}

export default supabase
