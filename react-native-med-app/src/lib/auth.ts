// ============================================================================
// Authentication Service
// ============================================================================

import { supabase, getRedirectUrl, isSupabaseConfigured, getSupabaseConfigStatus } from './supabase'
import { User, RegisterFormData, ProfileUpdateData, ActivationResponse, DeviceSession } from '@/types'
import { getDeviceId, getDeviceName, getDeviceFingerprint } from './deviceId'
import { clearQueryCache } from './query-client'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ============================================================================
// User Profile Caching for Offline Support
// ============================================================================

const USER_PROFILE_CACHE_KEY = '@fmc_user_profile_cache'

/**
 * Cache user profile to AsyncStorage for offline access
 */
export async function cacheUserProfile(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(user))
    if (__DEV__) {
      console.log('[Auth] User profile cached for offline use')
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[Auth] Failed to cache user profile:', error)
    }
  }
}

/**
 * Get cached user profile from AsyncStorage
 */
export async function getCachedUserProfile(): Promise<User | null> {
  try {
    const cached = await AsyncStorage.getItem(USER_PROFILE_CACHE_KEY)
    if (cached) {
      const user = JSON.parse(cached) as User
      if (__DEV__) {
        console.log('[Auth] Retrieved cached user profile')
      }
      return user
    }
    return null
  } catch (error) {
    if (__DEV__) {
      console.warn('[Auth] Failed to get cached user profile:', error)
    }
    return null
  }
}

/**
 * Clear cached user profile (call on logout)
 */
export async function clearCachedUserProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(USER_PROFILE_CACHE_KEY)
    if (__DEV__) {
      console.log('[Auth] Cleared cached user profile')
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[Auth] Failed to clear cached user profile:', error)
    }
  }
}

/**
 * Perform a ONE-TIME global reset for all users (v2 migration)
 * Clears old device IDs and forces a fresh logout/login
 */
export async function performGlobalResetOnce(): Promise<void> {
  const RESET_KEY = '@fmc_v2_migration_reset'
  try {
    const hasReset = await AsyncStorage.getItem(RESET_KEY)
    if (hasReset === 'true') return

    if (__DEV__) {
      console.log('[Auth] 🚨 TRIGGERING ONE-TIME GLOBAL RESET (V2)')
    }

    // 1. Force logout from Supabase
    await supabase.auth.signOut()

    // 2. Clear old Device ID (forces new secure format generation)
    // We already have a self-cleaning check in deviceId.ts, 
    // but this ensures we start with a clean slate.
    const { clearDeviceId } = require('./deviceId')
    await clearDeviceId()

    // 3. Clear cache
    await clearCachedUserProfile()
    await clearQueryCache()

    // 4. Mark as reset
    await AsyncStorage.setItem(RESET_KEY, 'true')
    
  } catch (error) {
    console.error('[Auth] Global reset failed:', error)
  }
}

/**
 * Check if an error is a network-related error
 */
function isNetworkError(errorMessage: string): boolean {
  const msg = errorMessage.toLowerCase()
  return (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('unable to resolve') ||
    msg.includes('connection') ||
    msg.includes('offline')
  )
}

// ============================================================================
// Sign Up
// ============================================================================

export async function signUp(data: RegisterFormData): Promise<{ user: User | null; error: string | null; needsEmailVerification?: boolean }> {
  try {
    console.log('[Auth] Starting sign up for:', data.email)

    // Check if Supabase is properly configured
    if (!isSupabaseConfigured()) {
      console.error('[Auth] Supabase not configured properly')
      return { user: null, error: 'L\'application n\'est pas correctement configurée. Veuillez contacter le support.' }
    }

    // 1. Create auth user with redirect URL for email verification
    const redirectUrl = getRedirectUrl()
    console.log('[Auth] Creating auth user...')

    let authData: any = null
    let authError: any = null

    try {
      const result = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      })
      authData = result.data
      authError = result.error
    } catch (e: any) {
      console.error('[Auth] signUp threw:', e)
      const errorMessage = e?.message || ''
      if (errorMessage.toLowerCase().includes('network') ||
        errorMessage.toLowerCase().includes('fetch')) {
        return { user: null, error: 'Problème de connexion réseau. Vérifiez votre connexion internet.' }
      }
      return { user: null, error: 'Erreur lors de la création du compte. Veuillez réessayer.' }
    }

    if (authError) {
      console.error('[Auth] Sign up error:', authError.message)
      return { user: null, error: translateAuthError(authError.message) }
    }

    if (!authData?.user) {
      return { user: null, error: 'Échec de la création du compte' }
    }

    console.log('[Auth] Auth user created, creating profile...')

    // 2. Create user profile using RPC function (bypasses RLS issues)
    try {
      const { data: profileResult, error: profileError } = await supabase
        .rpc('create_user_profile', {
          p_user_id: authData.user.id,
          p_email: data.email,
          p_full_name: data.full_name,
          p_speciality: data.speciality,
          p_year_of_study: data.year_of_study,
          p_region: data.region,
          p_faculty: data.faculty,
        })

      if (profileError) {
        console.error('[Auth] Profile creation error:', profileError.message)
        return { user: null, error: profileError.message }
      }

      // Check if profile creation was successful (RPC returns JSON object)
      const result = profileResult as { success: boolean; message: string } | null
      if (result && !result.success) {
        return { user: null, error: result.message || 'Échec de la création du profil' }
      }
    } catch (e: any) {
      console.error('[Auth] Profile creation threw:', e)
      return { user: null, error: 'Erreur lors de la création du profil. Veuillez réessayer.' }
    }

    console.log('[Auth] Profile created, activating subscription...')

    // 3. Activate subscription with code
    const activationResult = await activateSubscription(authData.user.id, data.activation_code)

    if (!activationResult.success) {
      return { user: null, error: activationResult.message }
    }

    console.log('[Auth] Subscription activated')

    // 4. Check if email confirmation is required
    // If user identity is not confirmed, they need to verify email
    if (authData.user.identities && authData.user.identities.length === 0) {
      return { user: null, error: null, needsEmailVerification: true }
    }

    // Check if session exists (no session = email not confirmed yet)
    if (!authData.session) {
      return { user: null, error: null, needsEmailVerification: true }
    }

    // 5. Register device (non-blocking)
    registerDevice(authData.user.id).catch(e => {
      console.warn('[Auth] Device registration failed (non-blocking):', e)
    })

    // 6. Fetch complete user profile
    try {
      const { data: userProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (fetchError) {
        // Profile created but can't fetch - likely needs email verification
        return { user: null, error: null, needsEmailVerification: true }
      }

      // Cache profile for offline use
      await cacheUserProfile(userProfile as User)

      console.log('[Auth] Sign up complete!')
      return { user: userProfile as User, error: null }
    } catch (e) {
      console.error('[Auth] Profile fetch threw:', e)
      return { user: null, error: null, needsEmailVerification: true }
    }
  } catch (error: any) {
    console.error('[Auth] Unexpected sign up error:', error)
    const errorMessage = error?.message || ''
    if (errorMessage.toLowerCase().includes('network') ||
      errorMessage.toLowerCase().includes('fetch')) {
      return { user: null, error: 'Problème de connexion réseau. Vérifiez votre connexion internet.' }
    }
    return { user: null, error: 'Une erreur inattendue s\'est produite. Veuillez réessayer.' }
  }
}

// ============================================================================
// Error Message Translation
// ============================================================================

function translateAuthError(error: string): string {
  const errorLower = error.toLowerCase()

  // Log the original error for debugging
  if (__DEV__) {
    console.log('[Auth] Translating error:', error)
  }

  // Common Supabase auth errors with French translations
  // Check most specific errors first
  if (errorLower.includes('invalid login credentials') || errorLower.includes('invalid credentials')) {
    return 'Email ou mot de passe incorrect. Veuillez vérifier vos informations.'
  }

  if (errorLower.includes('email not confirmed') || errorLower.includes('email address not confirmed')) {
    return 'Votre email n\'a pas été confirmé. Veuillez vérifier votre boîte mail et cliquer sur le lien de confirmation.'
  }

  if (errorLower.includes('too many requests') || errorLower.includes('rate limit')) {
    return 'Trop de tentatives de connexion. Veuillez attendre quelques minutes avant de réessayer.'
  }

  if (errorLower.includes('user not found') || errorLower.includes('no user found')) {
    return 'Aucun compte trouvé avec cet email. Veuillez vérifier l\'adresse email ou créer un compte.'
  }

  if (errorLower.includes('password') && errorLower.includes('weak')) {
    return 'Le mot de passe est trop faible. Utilisez au moins 8 caractères avec des lettres et des chiffres.'
  }

  if (errorLower.includes('email') && errorLower.includes('invalid')) {
    return 'Format d\'email invalide. Veuillez entrer une adresse email valide.'
  }

  if (errorLower.includes('signup') && errorLower.includes('disabled')) {
    return 'Les inscriptions sont temporairement désactivées. Veuillez réessayer plus tard.'
  }

  // Network errors - be more specific to avoid false positives
  // Only match actual network/connection errors, not "fetch profile" type errors
  if (errorLower.includes('network request failed') ||
    errorLower.includes('networkerror') ||
    errorLower.includes('failed to fetch') ||
    errorLower.includes('net::err') ||
    errorLower.includes('econnrefused') ||
    errorLower.includes('enotfound') ||
    errorLower.includes('unable to resolve host')) {
    return 'Problème de connexion réseau. Veuillez vérifier votre connexion internet et réessayer.'
  }

  if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
    return 'La connexion a pris trop de temps. Veuillez réessayer.'
  }

  // Return original error if no translation found
  return error
}

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ])
}

export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    console.log('[Auth] Starting sign in for:', email)

    // Check if Supabase is properly configured
    const configStatus = getSupabaseConfigStatus()
    console.log('[Auth] Supabase config status:', configStatus)

    if (!isSupabaseConfigured()) {
      console.error('[Auth] Supabase not configured properly:', configStatus)
      return { user: null, error: 'L\'application n\'est pas correctement configurée. Veuillez contacter le support.' }
    }

    // Debug device info in development
    if (__DEV__) {
      try {
        const { debugDeviceInfo } = await import('./deviceId')
        await debugDeviceInfo()
      } catch (e) {
        console.warn('[Auth] Debug device info failed:', e)
      }
    }

    // Step 1: Authenticate with Supabase
    console.log('[Auth] Calling signInWithPassword...')
    let authData: any = null
    let authError: any = null

    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      authData = result.data
      authError = result.error
    } catch (e: any) {
      console.error('[Auth] signInWithPassword threw:', e)
      const errorMessage = e?.message || ''
      // Check for network errors specifically
      if (errorMessage.toLowerCase().includes('network') ||
        errorMessage.toLowerCase().includes('fetch') ||
        errorMessage.toLowerCase().includes('timeout')) {
        return { user: null, error: 'Problème de connexion réseau. Vérifiez votre connexion internet.' }
      }
      return { user: null, error: translateAuthError(errorMessage || 'Erreur de connexion. Veuillez réessayer.') }
    }

    console.log('[Auth] Sign in response:', { hasUser: !!authData?.user, hasSession: !!authData?.session, error: authError?.message })

    if (authError) {
      console.error('[Auth] Sign in error:', authError.message)
      return { user: null, error: translateAuthError(authError.message) }
    }

    if (!authData?.user) {
      console.error('[Auth] No user returned from sign in')
      return { user: null, error: 'Échec de la connexion. Veuillez réessayer.' }
    }

    // Step 2: Fetch user profile
    console.log('[Auth] Fetching user profile for:', authData.user.id)
    let userProfile: any = null
    let fetchError: any = null

    try {
      const result = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      userProfile = result.data
      fetchError = result.error
    } catch (e: any) {
      console.error('[Auth] Profile fetch threw:', e)
      return { user: null, error: 'Impossible de charger le profil. Veuillez réessayer.' }
    }

    console.log('[Auth] Profile fetch result:', { hasProfile: !!userProfile, error: fetchError?.message })

    if (fetchError) {
      console.error('[Auth] Profile fetch error:', fetchError.message, fetchError.code)
      // Don't translate this error - show a specific message
      if (fetchError.code === 'PGRST116') {
        return { user: null, error: 'Profil utilisateur introuvable. Veuillez contacter le support.' }
      }
      return { user: null, error: 'Impossible de charger le profil. Veuillez réessayer.' }
    }

    if (!userProfile) {
      console.error('[Auth] No profile data returned')
      return { user: null, error: 'Profil utilisateur introuvable. Veuillez contacter le support.' }
    }

    // Step 3: Check device limit (skip for reviewers)
    const isReviewer = userProfile.is_reviewer === true
    if (!isReviewer) {
      console.log('[Auth] Checking device limit...')
      const { canLogin, error: deviceError, isLimitReached } = await checkDeviceLimit(authData.user.id)
      
      // Only block login if the actual device limit is reached (not for transient errors)
      if (!canLogin && isLimitReached) {
        console.warn('[Auth] Device limit reached, signing out')
        await supabase.auth.signOut()
        return { user: null, error: deviceError }
      }
      
      // Log transient errors but allow login (fail-open for network issues)
      if (!canLogin && !isLimitReached) {
        console.warn('[Auth] Device check failed (transient error), allowing login:', deviceError)
      }

      // Step 4: Register device - NON-BLOCKING
      console.log('[Auth] Registering device...')
      registerDevice(authData.user.id).catch(e => {
        console.warn('[Auth] Device registration failed (non-blocking):', e)
      })
    }

    // Debug device sessions in development (non-blocking)
    if (__DEV__) {
      debugDeviceSessions(authData.user.id).catch(e => {
        console.warn('[Auth] Debug device sessions failed:', e)
      })
    }

    // Cache profile for offline use
    await cacheUserProfile(userProfile as User)

    console.log('[Auth] Sign in complete!')
    return { user: userProfile as User, error: null }
  } catch (error: any) {
    console.error('[Auth] Unexpected sign in error:', error)
    const errorMessage = error?.message || ''
    // Check for network errors
    if (errorMessage.toLowerCase().includes('network') ||
      errorMessage.toLowerCase().includes('fetch')) {
      return { user: null, error: 'Problème de connexion réseau. Vérifiez votre connexion internet.' }
    }
    return { user: null, error: 'Une erreur inattendue s\'est produite. Veuillez réessayer.' }
  }
}

// ============================================================================
// Sign Out
// ============================================================================

export async function signOut(): Promise<{ error: string | null }> {
  try {
    // Clear cached profile first
    await clearCachedUserProfile()
    
    // Clear TanStack Query cache to prevent data leakage
    await clearQueryCache()

    const { error } = await supabase.auth.signOut()
    if (error) {
      return { error: error.message }
    }
    return { error: null }
  } catch (error) {
    return { error: 'An unexpected error occurred' }
  }
}

// ============================================================================
// Get Current User
// ============================================================================

export async function getCurrentUser(): Promise<{ user: User | null; error: string | null }> {
  try {
    // First, try to get the session from local storage (works offline)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      // Session error - check if it's a network error and we have cached profile
      if (isNetworkError(sessionError.message)) {
        const cached = await getCachedUserProfile()
        if (cached) {
          if (__DEV__) {
            console.log('[Auth] Using cached profile (session network error)')
          }
          return { user: cached, error: null }
        }
      }
      return { user: null, error: sessionError.message }
    }

    if (!session) {
      // No session - user is not logged in
      return { user: null, error: null }
    }

    // Session exists, try to fetch user profile from network
    try {
      const { data: userProfile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (fetchError) {
        // If we get a PGRST116 error (no rows), the user profile doesn't exist
        if (fetchError.code === 'PGRST116') {
          return { user: null, error: 'User profile not found' }
        }

        // For network/fetch errors, try to use cached profile
        if (isNetworkError(fetchError.message)) {
          const cached = await getCachedUserProfile()
          if (cached && cached.id === session.user.id) {
            if (__DEV__) {
              console.log('[Auth] Using cached profile (profile fetch failed - offline)')
            }
            return { user: cached, error: null }
          }
        }

        return { user: null, error: fetchError.message }
      }

      // Successfully fetched profile - cache it for offline use
      const user = userProfile as User
      await cacheUserProfile(user)
      return { user, error: null }

    } catch (fetchException: any) {
      // Network exception during fetch - try cached profile
      const errorMsg = fetchException?.message || 'Unknown error'
      if (__DEV__) {
        console.log('[Auth] Profile fetch exception:', errorMsg)
      }

      const cached = await getCachedUserProfile()
      if (cached && cached.id === session.user.id) {
        if (__DEV__) {
          console.log('[Auth] Using cached profile (fetch exception - offline)')
        }
        return { user: cached, error: null }
      }

      return { user: null, error: 'Unable to load profile. Please check your connection.' }
    }

  } catch (error: any) {
    // Unexpected error - last resort, try cache
    if (__DEV__) {
      console.error('[Auth] Unexpected error in getCurrentUser:', error)
    }

    const cached = await getCachedUserProfile()
    if (cached) {
      if (__DEV__) {
        console.log('[Auth] Using cached profile (unexpected error fallback)')
      }
      return { user: cached, error: null }
    }

    return { user: null, error: 'An unexpected error occurred' }
  }
}


// ============================================================================
// Update Profile
// ============================================================================

export async function updateProfile(userId: string, data: ProfileUpdateData): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return { user: null, error: error.message }
    }

    return { user: updatedUser as User, error: null }
  } catch (error) {
    return { user: null, error: 'An unexpected error occurred' }
  }
}

// ============================================================================
// Reset Password
// ============================================================================

export async function resetPassword(email: string): Promise<{ error: string | null }> {
  try {
    // Get redirect URL and ensure no whitespace
    const redirectUrl = getRedirectUrl('auth/callback').trim()

    if (__DEV__) {
      console.log('[Auth] Reset password redirect URL:', JSON.stringify(redirectUrl))
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    })
    if (error) {
      return { error: error.message }
    }
    return { error: null }
  } catch (error) {
    return { error: 'An unexpected error occurred' }
  }
}

// ============================================================================
// Activate Subscription
// ============================================================================

export async function activateSubscription(userId: string, keyCode: string): Promise<ActivationResponse> {
  try {
    const { data, error } = await supabase.rpc('activate_subscription', {
      p_user_id: userId,
      p_key_code: keyCode,
    })

    if (error) {
      return { success: false, message: error.message }
    }

    return data as ActivationResponse
  } catch (error) {
    return { success: false, message: 'An unexpected error occurred' }
  }
}

// ============================================================================
// Check Subscription Status
// ============================================================================

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('has_active_subscription', {
      p_user_id: userId,
    })

    if (error) {
      return false
    }

    return data as boolean
  } catch (error) {
    return false
  }
}

export async function getUserActivationCode(userId: string): Promise<{ code: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('activation_keys')
      .select('key_code')
      .eq('used_by', userId)
      .single()

    if (error) {
      // It's possible the user doesn't have a code (e.g. manually added), so we handle "no rows" gracefully if needed
      if (error.code === 'PGRST116') return { code: null, error: null }
      return { code: null, error: error.message }
    }

    return { code: data?.key_code || null, error: null }
  } catch (error: any) {
    return { code: null, error: error.message || 'Error fetching activation code' }
  }
}

// ============================================================================
// Device Management
// ============================================================================

export async function registerDevice(userId: string): Promise<{ error: string | null }> {
  try {
    const deviceId = await getDeviceId()
    const deviceName = await getDeviceName()
    const fingerprint = getDeviceFingerprint()

    const { error } = await supabase
      .from('device_sessions')
      .upsert({
        user_id: userId,
        device_id: deviceId,
        fingerprint: fingerprint,
        device_name: deviceName,
        last_active_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,device_id',
      })


    if (error) {
      if (__DEV__) {
        console.error('[Auth] Error registering device:', error.message)
      }
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    if (__DEV__) {
      console.error('[Auth] Failed to register device:', error)
    }
    return { error: 'Failed to register device' }
  }
}

export async function getDeviceSessions(userId: string): Promise<{ sessions: DeviceSession[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('device_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false })

    if (error) {
      return { sessions: [], error: error.message }
    }

    return { sessions: data || [], error: null }
  } catch (error) {
    return { sessions: [], error: 'Failed to fetch device sessions' }
  }
}

/**
 * Check if user has reached device limit (2 devices)
 * Returns canLogin: true if user can login, false if device limit reached
 * Returns isLimitReached: true only when the actual device limit is exceeded (not for transient errors)
 */
export async function checkDeviceLimit(userId: string): Promise<{ canLogin: boolean; error: string | null; isLimitReached: boolean }> {
  try {
    const { sessions, error } = await getDeviceSessions(userId)
    if (error) return { canLogin: false, error, isLimitReached: false }

    const currentDeviceId = await getDeviceId()
    const currentFingerprint = getDeviceFingerprint()
    
    // Check if THIS specific session instance is already registered
    if (sessions.some(s => s.device_id === currentDeviceId)) {
      return { canLogin: true, error: null, isLimitReached: false }
    }

    // Check if THIS physical hardware (fingerprint) is already registered
    if (sessions.some(s => s.fingerprint === currentFingerprint)) {
      return { canLogin: true, error: null, isLimitReached: false }
    }

    // Count unique physical devices already registered
    // We use fingerprint if available, fallback to device_id for legacy sessions
    const physicalDeviceFingerprints = new Set(
      sessions.map(s => s.fingerprint || s.device_id)
    )

    // If already using 2 physical devices and this is a 3rd one, block login
    if (physicalDeviceFingerprints.size >= 2) {
      return { 
        canLogin: false, 
        error: '🔴 Limite d\'appareils atteinte. Vous êtes déjà connecté sur 2 appareils',
        isLimitReached: true
      }
    }


    return { canLogin: true, error: null, isLimitReached: false }
  } catch (error) {
    if (__DEV__) {
      console.error('[Auth] Error checking device limit:', error)
    }
    return { canLogin: false, error: 'Impossible de vérifier les appareils', isLimitReached: false }
  }
}

export async function removeDevice(sessionId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('device_sessions')
      .delete()
      .eq('id', sessionId)

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    return { error: 'Failed to remove device' }
  }
}

// ============================================================================
// Debug Functions
// ============================================================================

export async function debugDeviceSessions(userId: string): Promise<void> {
  if (!__DEV__) return

  try {
    const currentDeviceId = await getDeviceId()
    const { sessions } = await getDeviceSessions(userId)

    console.log('[Auth Debug] Current device ID:', currentDeviceId)
    console.log('[Auth Debug] Device sessions:', sessions.map(s => ({
      id: s.id,
      device_id: s.device_id,
      device_name: s.device_name,
      last_active: s.last_active_at,
      is_current: s.device_id === currentDeviceId
    })))
  } catch (error) {
    console.error('[Auth Debug] Failed to debug device sessions:', error)
  }
}
