// ============================================================================
// Authentication Service
// ============================================================================

import { supabase, getRedirectUrl } from './supabase'
import { User, RegisterFormData, ProfileUpdateData, ActivationResponse, DeviceSession } from '@/types'
import { getDeviceId, getDeviceName } from './deviceId'

// ============================================================================
// Sign Up
// ============================================================================

export async function signUp(data: RegisterFormData): Promise<{ user: User | null; error: string | null; needsEmailVerification?: boolean }> {
  try {
    // 1. Create auth user with redirect URL for email verification
    const redirectUrl = getRedirectUrl()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    })

    if (authError) {
      return { user: null, error: authError.message }
    }

    if (!authData.user) {
      return { user: null, error: 'Failed to create user' }
    }

    // 2. Create user profile using RPC function (bypasses RLS issues)
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
      return { user: null, error: profileError.message }
    }

    // Check if profile creation was successful (RPC returns JSON object)
    const result = profileResult as { success: boolean; message: string } | null
    if (result && !result.success) {
      return { user: null, error: result.message || 'Failed to create profile' }
    }

    // 3. Activate subscription with code
    const activationResult = await activateSubscription(authData.user.id, data.activation_code)

    if (!activationResult.success) {
      return { user: null, error: activationResult.message }
    }

    // 4. Check if email confirmation is required
    // If user identity is not confirmed, they need to verify email
    if (authData.user.identities && authData.user.identities.length === 0) {
      return { user: null, error: null, needsEmailVerification: true }
    }

    // Check if session exists (no session = email not confirmed yet)
    if (!authData.session) {
      return { user: null, error: null, needsEmailVerification: true }
    }

    // 5. Register device
    await registerDevice(authData.user.id)

    // 6. Fetch complete user profile
    const { data: userProfile, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (fetchError) {
      // Profile created but can't fetch - likely needs email verification
      return { user: null, error: null, needsEmailVerification: true }
    }

    return { user: userProfile as User, error: null }
  } catch (error) {
    return { user: null, error: 'An unexpected error occurred' }
  }
}

// ============================================================================
// Error Message Translation
// ============================================================================

function translateAuthError(error: string): string {
  const errorLower = error.toLowerCase()
  
  // Common Supabase auth errors with French translations
  if (errorLower.includes('invalid login credentials') || errorLower.includes('invalid credentials')) {
    return 'Email ou mot de passe incorrect. Veuillez vérifier vos informations.'
  }
  
  if (errorLower.includes('email not confirmed') || errorLower.includes('email address not confirmed')) {
    return 'Votre email n\'a pas été confirmé. Veuillez vérifier votre boîte mail et cliquer sur le lien de confirmation.'
  }
  
  if (errorLower.includes('too many requests') || errorLower.includes('rate limit')) {
    return 'Trop de tentatives de connexion. Veuillez attendre quelques minutes avant de réessayer.'
  }
  
  if (errorLower.includes('network') || errorLower.includes('fetch')) {
    return 'Problème de connexion réseau. Veuillez vérifier votre connexion internet et réessayer.'
  }
  
  if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
    return 'La connexion a pris trop de temps. Veuillez réessayer.'
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
    
    // Debug device info in development
    if (__DEV__) {
      const { debugDeviceInfo } = await import('./deviceId')
      await debugDeviceInfo()
    }
    
    // Add 15 second timeout to prevent endless loading
    const authResult = await withTimeout(
      supabase.auth.signInWithPassword({
        email,
        password,
      }),
      15000,
      'La connexion a pris trop de temps. Veuillez réessayer.'
    )
    
    const authData = authResult.data
    const authError = authResult.error

    console.log('[Auth] Sign in response:', { hasUser: !!authData?.user, error: authError?.message })

    if (authError) {
      console.error('[Auth] Sign in error:', authError.message)
      return { user: null, error: translateAuthError(authError.message) }
    }

    if (!authData.user) {
      console.error('[Auth] No user returned from sign in')
      return { user: null, error: 'Failed to sign in' }
    }

    console.log('[Auth] Fetching user profile...')
    
    // Fetch user profile first to check if they're a reviewer
    const profilePromise = supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()
    
    const profileResult = await withTimeout(
      Promise.resolve(profilePromise),
      10000,
      'Impossible de charger le profil. Veuillez réessayer.'
    )
    
    const userProfile = profileResult.data
    const fetchError = profileResult.error

    console.log('[Auth] Profile fetch result:', { hasProfile: !!userProfile, error: fetchError?.message })

    if (fetchError) {
      console.error('[Auth] Profile fetch error:', fetchError.message)
      return { user: null, error: translateAuthError(fetchError.message) }
    }

    // Skip device limit check for reviewer accounts (for app store review)
    const isReviewer = (userProfile as any).is_reviewer === true

    if (!isReviewer) {
      console.log('[Auth] Device limit will be enforced by database trigger if needed')
      // Note: We removed the premature client-side device count check because:
      // 1. It created a race condition - blocking login before the database trigger could handle it
      // 2. The database trigger automatically removes the oldest device when limit is exceeded
      // 3. This provides better UX - users don't get blocked, oldest device just gets replaced
    }

    console.log('[Auth] Registering device...')
    // Register/update device session
    await registerDevice(authData.user.id)

    // Debug device sessions in development
    if (__DEV__) {
      await debugDeviceSessions(authData.user.id)
    }

    console.log('[Auth] Sign in complete!')
    return { user: userProfile as User, error: null }
  } catch (error: any) {
    console.error('[Auth] Unexpected sign in error:', error)
    return { user: null, error: translateAuthError(error?.message || 'Une erreur inattendue s\'est produite') }
  }
}

// ============================================================================
// Sign Out
// ============================================================================

export async function signOut(): Promise<{ error: string | null }> {
  try {
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
    // First, try to get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return { user: null, error: sessionError.message }
    }
    
    if (!session) {
      // No session - user is not logged in
      return { user: null, error: null }
    }

    // Session exists, fetch user profile
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
      return { user: null, error: fetchError.message }
    }

    return { user: userProfile as User, error: null }
  } catch (error) {
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

// ============================================================================
// Device Management
// ============================================================================

export async function registerDevice(userId: string): Promise<{ error: string | null }> {
  try {
    const deviceId = await getDeviceId()
    const deviceName = await getDeviceName()

    const { error } = await supabase
      .from('device_sessions')
      .upsert({
        user_id: userId,
        device_id: deviceId,
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
