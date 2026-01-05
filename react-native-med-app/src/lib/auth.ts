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
// Sign In
// ============================================================================

export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return { user: null, error: authError.message }
    }

    if (!authData.user) {
      return { user: null, error: 'Failed to sign in' }
    }

    // Fetch user profile first to check if they're a reviewer
    const { data: userProfile, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (fetchError) {
      return { user: null, error: fetchError.message }
    }

    // Skip device limit check for reviewer accounts (for app store review)
    const isReviewer = (userProfile as any).is_reviewer === true

    if (!isReviewer) {
      // Check device count before registering new device
      const { sessions, error: sessionsError } = await getDeviceSessions(authData.user.id)
      const currentDeviceId = await getDeviceId()
      const isCurrentDeviceRegistered = sessions.some(session => session.device_id === currentDeviceId)

      // If this is a new device and user already has 2 devices, block login
      if (!isCurrentDeviceRegistered && sessions.length >= 2) {
        // Sign out the user immediately
        await supabase.auth.signOut()
        return {
          user: null,
          error: 'Limite d\'appareils atteinte. Vous ne pouvez utiliser que 2 appareils maximum. Veuillez vous déconnecter d\'un autre appareil pour continuer.'
        }
      }
    }

    // Register/update device session
    await registerDevice(authData.user.id)

    return { user: userProfile as User, error: null }
  } catch (error) {
    return { user: null, error: 'An unexpected error occurred' }
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
    const redirectUrl = getRedirectUrl()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
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
