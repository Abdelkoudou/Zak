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

function generateUnifiedDeviceId(): string {
  loadModules()
  
  // Get screen characteristics (use consistent orientation - always width >= height)
  let screenWidth = 1920
  let screenHeight = 1080
  
  try {
    if (_Dimensions) {
      const screen = _Dimensions.get('screen')
      screenWidth = Math.max(screen.width, screen.height)  // Always use larger as width
      screenHeight = Math.min(screen.width, screen.height) // Always use smaller as height
    }
  } catch {
    // Use defaults
  }
  
  // Get simplified OS name for consistency between mobile and web
  let osName = 'Unknown'
  
  try {
    if (_Device?.osName) {
      const deviceOsName = _Device.osName.toLowerCase()
      // Normalize OS names to match web detection
      if (deviceOsName.includes('android')) osName = 'Android'
      else if (deviceOsName.includes('ios')) osName = 'iOS'
      else if (deviceOsName.includes('windows')) osName = 'Windows'
      else if (deviceOsName.includes('mac')) osName = 'macOS'
      else if (deviceOsName.includes('linux')) osName = 'Linux'
      else osName = _Device.osName
    }
  } catch {
    // Use default
  }
  
  // Create device string focusing on hardware characteristics
  // This should be consistent whether accessed via mobile app or web browser
  const screenInfo = `${screenWidth}x${screenHeight}`
  const deviceString = `${osName}-${screenInfo}`
  
  // Create a hash-like identifier (same algorithm as web)
  let hash = 0
  for (let i = 0; i < deviceString.length; i++) {
    const char = deviceString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  const hashString = Math.abs(hash).toString(36)
  
  if (__DEV__) {
    console.log('[DeviceId] Device string:', deviceString, '-> Hash:', hashString)
  }
  
  return `unified-${hashString}`
}

// ============================================================================
// Device ID Functions
// ============================================================================

export async function getDeviceId(): Promise<string> {
  try {
    const storage = await getSecureStorage()
    
    let deviceId = await storage.getItemAsync(DEVICE_ID_KEY)
    
    if (!deviceId) {
      deviceId = generateUnifiedDeviceId()
      await storage.setItemAsync(DEVICE_ID_KEY, deviceId)
      
      if (__DEV__) {
        console.log('[DeviceId] Generated device ID:', deviceId)
      }
    }
    
    return deviceId
  } catch (error) {
    if (__DEV__) {
      console.error('[DeviceId] Error getting device ID:', error)
    }
    return generateUnifiedDeviceId()
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
