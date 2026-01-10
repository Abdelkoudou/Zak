// ============================================================================
// Device ID Generation - Backward Compatible
// ============================================================================

import { Platform, Dimensions } from 'react-native'
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
// Device ID Generation - Unified Approach
// ============================================================================

/**
 * Generate a deterministic device ID from device info
 * This creates a unified ID that should be similar whether accessing
 * via mobile app or web browser on the same device
 */
function generateDeterministicDeviceId(): string {
  // Get screen dimensions (use consistent orientation - always width >= height)
  const screen = Dimensions.get('screen')
  const screenWidth = Math.max(screen.width, screen.height)  // Always use larger dimension as width
  const screenHeight = Math.min(screen.width, screen.height) // Always use smaller dimension as height
  const screenInfo = `${screenWidth}x${screenHeight}`
  
  // Get OS name
  const osName = Device.osName || 'Unknown OS'
  
  // Create a device string that focuses on hardware characteristics
  // This should match the web version for the same device
  const deviceString = `${osName}-${screenInfo}`
  
  // Create a hash-like identifier (same algorithm as web)
  let hash = 0
  for (let i = 0; i < deviceString.length; i++) {
    const char = deviceString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Convert to positive string - use same format as web
  const hashString = Math.abs(hash).toString(36)
  return `unified-${hashString}`
}

// ============================================================================
// Device ID Functions
// ============================================================================

/**
 * Get or create a persistent device ID
 * 
 * UNIFIED APPROACH:
 * - Uses deterministic ID generation for consistency
 * - Same algorithm for both native and web platforms
 * - Stores the ID for consistency across app restarts
 * 
 * This ensures the same device gets the same ID regardless of platform.
 */
export async function getDeviceId(): Promise<string> {
  try {
    const storage = await getSecureStorage()
    
    // Check for existing stored device ID
    let deviceId = await storage.getItemAsync(DEVICE_ID_KEY)
    
    if (!deviceId) {
      // Always use unified deterministic ID generation
      deviceId = generateDeterministicDeviceId()
      
      // Store for future consistency
      await storage.setItemAsync(DEVICE_ID_KEY, deviceId)
      
      if (__DEV__) {
        console.log('[DeviceId] Generated and stored unified device ID:', deviceId)
      }
    }
    
    return deviceId
  } catch (error) {
    if (__DEV__) {
      console.error('[DeviceId] Error getting device ID:', error)
    }
    
    // Fallback: generate without storing
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
