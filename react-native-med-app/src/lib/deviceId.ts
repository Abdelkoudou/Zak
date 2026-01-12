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
// Device ID Generation - Unified Approach
// ============================================================================

function generateDeterministicDeviceId(): string {
  loadModules()
  
  let screenWidth = 1920
  let screenHeight = 1080
  let osName = 'Unknown OS'
  
  try {
    if (_Dimensions) {
      const screen = _Dimensions.get('screen')
      screenWidth = Math.max(screen.width, screen.height)
      screenHeight = Math.min(screen.width, screen.height)
    }
  } catch {
    // Use defaults
  }
  
  try {
    if (_Device?.osName) {
      osName = _Device.osName
    }
  } catch {
    // Use default
  }
  
  const screenInfo = `${screenWidth}x${screenHeight}`
  const deviceString = `${osName}-${screenInfo}`
  
  // Create a hash-like identifier
  let hash = 0
  for (let i = 0; i < deviceString.length; i++) {
    const char = deviceString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  const hashString = Math.abs(hash).toString(36)
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
      deviceId = generateDeterministicDeviceId()
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
    return generateDeterministicDeviceId()
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
  } catch {
    // Ignore errors
  }
}
