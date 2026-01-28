// ============================================================================
// Device ID Generation - Crash-Safe with Lazy Loading
// ============================================================================

// Storage key for device ID
const DEVICE_ID_KEY = 'fmc_device_id'

// Lazy-loaded modules
let _Platform: typeof import('react-native').Platform | null = null
let _Dimensions: typeof import('react-native').Dimensions | null = null
let _Device: typeof import('expo-device') | null = null
let _modulesLoaded = false

// Safely load React Native modules
function loadModules() {
  if (_modulesLoaded) return
  _modulesLoaded = true
  
  try {
    const RN = require('react-native')
    _Platform = RN.Platform
    _Dimensions = RN.Dimensions
  } catch (error) {
    if (__DEV__) {
      console.warn('[DeviceId] Failed to load React Native:', error)
    }
  }
  
  try {
    _Device = require('expo-device')
  } catch (error) {
    if (__DEV__) {
      console.warn('[DeviceId] Failed to load expo-device:', error)
    }
  }
}

// ============================================================================
// Platform-specific storage
// ============================================================================

async function getSecureStorage() {
  loadModules()
  
  if (_Platform?.OS === 'web') {
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
  try {
    const SecureStore = require('expo-secure-store')
    return SecureStore
  } catch {
    // Fallback to a no-op storage
    return {
      getItemAsync: async (): Promise<string | null> => null,
      setItemAsync: async (): Promise<void> => {},
    }
  }
}

// ============================================================================
// Device ID Generation - Unified Approach for Consistency
// ============================================================================

/**
 * Generate a TRUE unique device identifier
 * This ID is permanent - stored in SecureStore
 * App reinstall = new device ID (intentional)
 */
function generatePermanentDeviceId(): string {
  try {
    // Generate a true UUID - unique per device installation
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `device-${crypto.randomUUID()}`
    }
    
    // Fallback: timestamp + high-entropy random string
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15)
    
    return `device-${timestamp}-${random}`
  } catch (error) {
    // Ultimate fallback
    return `device-fallback-${Date.now()}-${Math.floor(Math.random() * 1000000)}`
  }
}
/**
 * Generate a hardware fingerprint (non-unique)
 * This is used to link independent sessions (App, Web) on the same physical device.
 * It's based on OS and Screen Resolution.
 */
export function getDeviceFingerprint(): string {
  loadModules()
  
  // Get screen characteristics (use consistent orientation - always width >= height)
  let screenWidth = -1
  let screenHeight = -1
  let dimensionsUnavailable = false
  
  try {
    if (_Dimensions) {
      const screen = _Dimensions.get('screen')
      if (screen.width > 0 && screen.height > 0) {
        screenWidth = Math.max(screen.width, screen.height)
        screenHeight = Math.min(screen.width, screen.height)
      } else {
        dimensionsUnavailable = true
      }
    } else {
      dimensionsUnavailable = true
    }
  } catch {
    dimensionsUnavailable = true
  }
  
  // Get simplified OS name
  let osName = 'Unknown'
  try {
    if (_Device?.osName) {
      const deviceOsName = _Device.osName.toLowerCase()
      // Consistently treat iPad as iOS
      if (deviceOsName.includes('ios') || deviceOsName.includes('ipados') || deviceOsName.includes('ipad')) {
        osName = 'iOS'
      } else if (deviceOsName.includes('android')) {
        osName = 'Android'
      } else if (deviceOsName.includes('windows')) {
        osName = 'Windows'
      } else if (deviceOsName.includes('mac')) {
        osName = 'macOS'
      } else if (deviceOsName.includes('linux')) {
        osName = 'Linux'
      } else {
        osName = _Device.osName
      }
    }
  } catch {}
  
  const resStr = dimensionsUnavailable ? 'unavail' : `${screenWidth}x${screenHeight}`
  return `${osName}-${resStr}`
}


// ============================================================================
// Device ID Functions
// ============================================================================

export async function getDeviceId(): Promise<string> {
  try {
    const storage = await getSecureStorage()
    
    let deviceId = await storage.getItemAsync(DEVICE_ID_KEY)
    
    // MIGRATION: If we have an old "unified-" ID, clear it to force new secure format
    if (deviceId && deviceId.startsWith('unified-')) {
      if (__DEV__) {
        console.log('[DeviceId] Migrating from old unified id...')
      }
      deviceId = null
      await storage.setItemAsync(DEVICE_ID_KEY, '')
    }

    if (!deviceId) {
      deviceId = generatePermanentDeviceId()
      await storage.setItemAsync(DEVICE_ID_KEY, deviceId)
      
      if (__DEV__) {
        console.log('[DeviceId] Generated new permanent device ID:', deviceId)
      }
    }
    
    return deviceId
  } catch (error) {
    if (__DEV__) {
      console.error('[DeviceId] Error getting device ID:', error)
    }
    // Fallback to a one-time ID for this session if storage fails
    return `device-temp-${Date.now()}`
  }
}


export async function getDeviceName(): Promise<string> {
  loadModules()
  
  try {
    if (_Platform?.OS === 'web') {
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
      if (userAgent.includes('Chrome')) return 'Chrome Browser'
      if (userAgent.includes('Firefox')) return 'Firefox Browser'
      if (userAgent.includes('Safari')) return 'Safari Browser'
      if (userAgent.includes('Edge')) return 'Edge Browser'
      return 'Web Browser'
    }
    
    const deviceName = _Device?.deviceName || 'Unknown Device'
    const osName = _Device?.osName || ''
    const osVersion = _Device?.osVersion || ''
    
    return osVersion ? `${deviceName} (${osName} ${osVersion})` : `${deviceName} (${osName})`
  } catch {
    return 'Unknown Device'
  }
}

export async function clearDeviceId(): Promise<void> {
  loadModules()
  
  try {
    if (_Platform?.OS === 'web') {
      localStorage.removeItem(DEVICE_ID_KEY)
    } else {
      const SecureStore = require('expo-secure-store')
      await SecureStore.deleteItemAsync(DEVICE_ID_KEY)
    }
    
    if (__DEV__) {
      console.log('[DeviceId] Cleared stored device ID')
    }
  } catch {
    // Ignore errors
  }
}

// ============================================================================
// Debug Functions
// ============================================================================

export async function debugDeviceInfo(): Promise<void> {
  if (!__DEV__) return
  
  loadModules()
  
  try {
    const deviceId = await getDeviceId()
    const deviceName = await getDeviceName()
    
    let screenInfo = 'Unknown'
    let osInfo = 'Unknown'
    
    try {
      if (_Dimensions) {
        const screen = _Dimensions.get('screen')
        screenInfo = `${Math.max(screen.width, screen.height)}x${Math.min(screen.width, screen.height)}`
      }
    } catch {}
    
    try {
      if (_Device?.osName) {
        osInfo = _Device.osName
      }
    } catch {}
    
    console.log('[DeviceId Debug] Device ID:', deviceId)
    console.log('[DeviceId Debug] Device Name:', deviceName)
    console.log('[DeviceId Debug] Screen Info:', screenInfo)
    console.log('[DeviceId Debug] OS Info:', osInfo)
  } catch (error) {
    console.error('[DeviceId Debug] Failed to debug device info:', error)
  }
}
