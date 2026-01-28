// ============================================================================
// Device Authentication - Web Interface
// ============================================================================

import { supabase } from '@/lib/supabase'
import { getDeviceId, getDeviceName, getDeviceFingerprint } from '@/lib/deviceId'

export interface DeviceSession {
  id: string
  user_id: string
  device_id: string
  fingerprint: string | null
  device_name: string | null
  last_active_at: string
  created_at: string
}

// ============================================================================
// Device Management
// ============================================================================

/**
 * Register or update device session for web interface
 */
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
      console.error('[DeviceAuth] Error registering device:', error.message)
      return { error: error.message }
    }

    console.log('[DeviceAuth] Device registered successfully')
    return { error: null }
  } catch (error) {
    console.error('[DeviceAuth] Failed to register device:', error)
    return { error: 'Failed to register device' }
  }
}

/**
 * Get user's device sessions
 */
export async function getDeviceSessions(userId: string): Promise<{ sessions: DeviceSession[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('device_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false })

    if (error) {
      console.error('[DeviceAuth] Error fetching device sessions:', error.message)
      return { sessions: [], error: error.message }
    }

    return { sessions: data || [], error: null }
  } catch (error) {
    console.error('[DeviceAuth] Failed to fetch device sessions:', error)
    return { sessions: [], error: 'Failed to fetch device sessions' }
  }
}

/**
 * Check if user has reached device limit (2 devices)
 * Returns canLogin: true if user can login, false if device limit reached
 * Returns isLimitReached: true only when the actual device limit is exceeded
 */
export async function checkDeviceLimit(userId: string): Promise<{ canLogin: boolean; error: string | null; isLimitReached: boolean }> {
  try {
    const { sessions, error } = await getDeviceSessions(userId)
    
    if (error) {
      return { canLogin: false, error, isLimitReached: false }
    }

    const currentDeviceId = await getDeviceId()
    const currentFingerprint = getDeviceFingerprint()

    // Check if THIS specific session instance is already registered
    if (sessions.some(session => session.device_id === currentDeviceId)) {
      return { canLogin: true, error: null, isLimitReached: false }
    }

    // Check if THIS physical hardware (fingerprint) is already registered
    if (sessions.some(session => session.fingerprint === currentFingerprint)) {
      return { canLogin: true, error: null, isLimitReached: false }
    }

    // Count unique physical devices already registered
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
    console.error('[DeviceAuth] Error checking device limit:', error)
    return { canLogin: false, error: 'Failed to check device limit', isLimitReached: false }
  }
}

/**
 * Update device activity timestamp
 */
export async function updateDeviceActivity(userId: string): Promise<void> {
  try {
    const deviceId = await getDeviceId()
    
    await supabase
      .from('device_sessions')
      .update({ last_active_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('device_id', deviceId)
  } catch (error) {
    console.error('[DeviceAuth] Failed to update device activity:', error)
  }
}

/**
 * Perform a ONE-TIME global reset for all users (v2 migration)
 * Clears old device IDs and forces a fresh logout/login
 */
export async function performGlobalResetOnce(): Promise<void> {
  const RESET_KEY = 'fmc_v2_migration_reset'
  try {
    if (typeof window === 'undefined') return

    const hasReset = localStorage.getItem(RESET_KEY)
    if (hasReset === 'true') return

    console.log('[DeviceAuth] 🚨 TRIGGERING ONE-TIME GLOBAL RESET (V2)')

    // 1. Force logout from Supabase
    await supabase.auth.signOut()

    // 2. Clear old Device ID
    const { clearDeviceId } = await import('./deviceId')
    clearDeviceId()

    // 3. Mark as reset
    localStorage.setItem(RESET_KEY, 'true')
    
  } catch (error) {
    console.error('[DeviceAuth] Global reset failed:', error)
  }
}
