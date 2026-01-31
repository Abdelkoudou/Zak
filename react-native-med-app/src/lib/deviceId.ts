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
 * Format: {OS}-{Model}-{Dimensions}
 * Example: Android-Pixel9-910x410, iOS-iPhone-1180x820
 */
export function getDeviceFingerprint(): string {
  loadModules()
  
  const osName = getOSName()
  const model = getDeviceModel()
  const dims = getScreenDimensions()
  
  return `${osName}-${model}-${dims}`
}

/**
 * Get simplified OS name
 */
function getOSName(): string {
  try {
    if (_Device?.osName) {
      const deviceOsName = _Device.osName.toLowerCase()
      if (deviceOsName.includes('ios') || deviceOsName.includes('ipados') || deviceOsName.includes('ipad')) {
        return 'iOS'
      } else if (deviceOsName.includes('android')) {
        return 'Android'
      } else if (deviceOsName.includes('windows')) {
        return 'Windows'
      } else if (deviceOsName.includes('mac')) {
        return 'macOS'
      } else if (deviceOsName.includes('linux')) {
        return 'Linux'
      }
      return _Device.osName
    }
    
    // Web fallback: parse from userAgent
    if (_Platform?.OS === 'web' && typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase()
      if (ua.includes('android')) return 'Android'
      if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS'
      if (ua.includes('windows')) return 'Windows'
      if (ua.includes('mac')) return 'macOS'
      if (ua.includes('linux')) return 'Linux'
    }
  } catch {}
  return 'Unknown'
}

/**
 * Get device model for fingerprinting
 * - iOS: Returns "iPhone" or "iPad" (specific model not available in web UA)
 * - Android: Returns actual model like "Pixel9", "SMS928B"
 * - Desktop/Unknown: Returns "Desktop" or "Unknown"
 */
function getDeviceModel(): string {
  try {
    // === NATIVE PLATFORM ===
    if (_Platform?.OS !== 'web') {
      const modelName = _Device?.modelName
      
      if (_Platform?.OS === 'ios') {
        // For iOS, use generic "iPhone" or "iPad" to match web fingerprint
        // (Safari UA doesn't include specific model)
        if (modelName?.toLowerCase().includes('iphone')) return 'iPhone'
        if (modelName?.toLowerCase().includes('ipad')) return 'iPad'
        return 'iDevice'
      }
      
      if (_Platform?.OS === 'android') {
        // For Android, use the specific model name
        if (modelName) {
          return normalizeModelName(modelName)
        }
        // Fallback if modelName unavailable (rare)
        return 'AndroidDevice'
      }
    }
    
    // === WEB PLATFORM ===
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent
      
      // Android: Extract model from UA
      // Pattern: "Android XX; MODEL_NAME)" or "Android XX; MODEL_NAME Build/"
      const androidMatch = ua.match(/Android\s+[\d.]+;\s*([^;)]+?)(?:\s+Build\/|\))/i)
      if (androidMatch && androidMatch[1]) {
        return normalizeModelName(androidMatch[1].trim())
      }
      
      // iOS: Just return iPhone/iPad (model not in UA)
      if (ua.includes('iPhone')) return 'iPhone'
      if (ua.includes('iPad')) return 'iPad'
      
      // Android fallback (e.g., Firefox which doesn't expose model)
      if (ua.includes('Android')) {
        return ua.includes('Mobile') ? 'AndroidMobile' : 'AndroidTablet'
      }
      
      // Desktop detection
      if (ua.includes('Windows')) return 'Desktop'
      if (ua.includes('Macintosh')) return 'Desktop'
      if (ua.includes('Linux')) return 'Desktop'
    }
  } catch {}
  
  return 'Unknown'
}

/**
 * Normalize model name: remove spaces, dashes, special chars
 * "Pixel 9" → "Pixel9"
 * "SM-S928B" → "SMS928B"
 * "sdk_gphone64_x86_64" → "sdkgphone64x8664"
 */
function normalizeModelName(model: string): string {
  return model.replace(/[\s\-_]+/g, '').replace(/[^a-zA-Z0-9]/g, '')
}

/**
 * Get bucketed screen dimensions
 * Floor to nearest 10px for consistency between native and web
 */
function getScreenDimensions(): string {
  try {
    if (_Dimensions) {
      const screen = _Dimensions.get('screen')
      if (screen.width > 0 && screen.height > 0) {
        // Ensure landscape orientation (width >= height)
        const rawWidth = Math.max(screen.width, screen.height)
        const rawHeight = Math.min(screen.width, screen.height)
        // Floor to nearest 10px for tolerance
        const width = Math.floor(rawWidth / 10) * 10
        const height = Math.floor(rawHeight / 10) * 10
        return `${width}x${height}`
      }
    }
    
    // Web fallback
    if (typeof screen !== 'undefined' && screen.width > 0 && screen.height > 0) {
      const rawWidth = Math.max(screen.width, screen.height)
      const rawHeight = Math.min(screen.width, screen.height)
      const width = Math.floor(rawWidth / 10) * 10
      const height = Math.floor(rawHeight / 10) * 10
      return `${width}x${height}`
    }
  } catch {}
  
  return 'unavail'
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
      
      // Detect if mobile browser
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      const deviceEmoji = isMobile ? '📱' : '💻'
      const deviceType = isMobile ? 'Navigateur Mobile' : 'Navigateur Desktop'
      
      // Detect browser name
      let browserName = ''
      if (userAgent.includes('Edg') || userAgent.includes('Edge')) browserName = 'Edge'
      else if (userAgent.includes('Chrome') && !userAgent.includes('Edge') && !userAgent.includes('Edg')) browserName = 'Chrome'
      else if (userAgent.includes('Firefox')) browserName = 'Firefox'
      else if (userAgent.includes('Safari') && !userAgent.includes('Chrome') && !userAgent.includes('Edg')) browserName = 'Safari'
      
      if (browserName) {
        return `${deviceEmoji} ${deviceType} (${browserName})`
      }
      return `${deviceEmoji} ${deviceType}`
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
