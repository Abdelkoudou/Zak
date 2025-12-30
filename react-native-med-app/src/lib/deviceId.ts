// ============================================================================
// Device ID Generation - Backward Compatible
// ============================================================================

import { Platform } from 'react-native'
import * as Device from 'expo-device'

// Storage key for device ID
const DEVICE_ID_KEY = 'fmc_device_id'

// ============================================================================
// Platform-specific storage
// ============================================================================

/**
 * Get secure storage based on platform
 * - Native: expo-secure-store (encrypted)
 * - Web: localStorage (with prefix)
 */
async function getSecureStorage() {
  if (Platform.OS === 'web') {
    return {
      getItemAsync: async (key: string): Promise<string | null> => {
        try {
          return localStorage.getItem(key)
        } catch {
          return null
        }
      },
      setItemAsync: async (key: string, value: string): Promise<void> => {
        try {
          localStorage.setItem(key, value)
        } catch {
          // Ignore storage errors on web
        }
      },
    }
  }
  
  // Native platforms use expo-secure-store
  const SecureStore = require('expo-secure-store')
  return SecureStore
}

// ============================================================================
// Device ID Generation - Deterministic (Backward Compatible)
// ============================================================================

/**
 * Generate a deterministic device ID from device info
 * This matches the ORIGINAL implementation to maintain backward compatibility
 * with existing device_sessions in the database
 */
function generateDeterministicDeviceId(): string {
  const deviceType = Device.deviceType
  const deviceName = Device.deviceName || 'Unknown Device'
  const osName = Device.osName || 'Unknown OS'
  const osVersion = Device.osVersion || ''

  // Create a simple hash from device info (matches original implementation)
  const deviceString = `${deviceType}-${deviceName}-${osName}-${osVersion}`
  return deviceString.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)
}

/**
 * Generate device ID for web platform
 */
function generateWebDeviceId(): string {
  // For web, create a fingerprint from available browser info
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent || ''
    const language = navigator.language || ''
    const platform = navigator.platform || ''
    
    const fingerprint = `web-${platform}-${language}-${userAgent.substring(0, 50)}`
    return fingerprint.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)
  }
  
  return 'web-unknown'
}

// ============================================================================
// Device ID Functions
// ============================================================================

/**
 * Get or create a persistent device ID
 * 
 * BACKWARD COMPATIBILITY:
 * - Uses deterministic ID generation (same as original code)
 * - Stores the ID for consistency across app restarts
 * - Existing users will get the same ID they had before
 * 
 * This ensures existing device_sessions in the database remain valid.
 */
export async function getDeviceId(): Promise<string> {
  try {
    const storage = await getSecureStorage()
    
    // Check for existing stored device ID
    let deviceId = await storage.getItemAsync(DEVICE_ID_KEY)
    
    if (!deviceId) {
      // Generate deterministic ID (backward compatible with original implementation)
      if (Platform.OS === 'web') {
        deviceId = generateWebDeviceId()
      } else {
        deviceId = generateDeterministicDeviceId()
      }
      
      // Store for future consistency
      await storage.setItemAsync(DEVICE_ID_KEY, deviceId)
      
      if (__DEV__) {
        console.log('[DeviceId] Generated and stored device ID')
      }
    }
    
    return deviceId
  } catch (error) {
    if (__DEV__) {
      console.error('[DeviceId] Error getting device ID:', error)
    }
    
    // Fallback: generate without storing
    if (Platform.OS === 'web') {
      return generateWebDeviceId()
    }
    return generateDeterministicDeviceId()
  }
}

/**
 * Get a human-readable device name for display purposes
 */
export async function getDeviceName(): Promise<string> {
  try {
    const deviceName = Device.deviceName || 'Unknown Device'
    const osName = Device.osName || ''
    const osVersion = Device.osVersion || ''
    
    if (Platform.OS === 'web') {
      // For web, try to get browser info
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
      if (userAgent.includes('Chrome')) return 'Chrome Browser'
      if (userAgent.includes('Firefox')) return 'Firefox Browser'
      if (userAgent.includes('Safari')) return 'Safari Browser'
      if (userAgent.includes('Edge')) return 'Edge Browser'
      return 'Web Browser'
    }
    
    return osVersion ? `${deviceName} (${osName} ${osVersion})` : `${deviceName} (${osName})`
  } catch {
    return 'Unknown Device'
  }
}

/**
 * Clear stored device ID (useful for testing or logout scenarios)
 * Note: This will cause a new device ID to be generated on next getDeviceId() call
 */
export async function clearDeviceId(): Promise<void> {
  try {
    const storage = await getSecureStorage()
    if (Platform.OS === 'web') {
      localStorage.removeItem(DEVICE_ID_KEY)
    } else {
      const SecureStore = require('expo-secure-store')
      await SecureStore.deleteItemAsync(DEVICE_ID_KEY)
    }
  } catch {
    // Ignore errors
  }
}
