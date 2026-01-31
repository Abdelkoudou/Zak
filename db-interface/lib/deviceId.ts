// ============================================================================
// Device ID Generation - Web Interface
// ============================================================================

// Storage key for device ID (matches mobile app)
const DEVICE_ID_KEY = 'fmc_device_id'

// ============================================================================
// Device ID Generation - Unified Approach
// ============================================================================

/**
 * Generate a TRUE unique device identifier
 * This ID is permanent - stored in localStorage
 * LocalStorage clear = new device ID (intentional)
 */
function generatePermanentDeviceId(): string {
  try {
    // Generate a true UUID - unique per browser instance
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
  const osName = getOSName()
  const model = getDeviceModel()
  const dims = getScreenDimensions()
  
  return `${osName}-${model}-${dims}`
}

/**
 * Get simplified OS name
 */
function getOSName(): string {
  const userAgent = navigator.userAgent || ''
  
  if (userAgent.includes('Android')) return 'Android'
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS'
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Mac')) return 'macOS'
  if (userAgent.includes('Linux')) return 'Linux'
  
  return 'Unknown'
}

/**
 * Get device model for fingerprinting
 * - iOS: Returns "iPhone" or "iPad" (specific model not available in UA)
 * - Android: Returns actual model like "Pixel9", "SMS928B"
 * - Desktop: Returns "Desktop"
 */
function getDeviceModel(): string {
  const ua = navigator.userAgent || ''
  
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
  
  return 'Unknown'
}

/**
 * Normalize model name: remove spaces, dashes, special chars
 * "Pixel 9" → "Pixel9"
 * "SM-S928B" → "SMS928B"
 */
function normalizeModelName(model: string): string {
  return model.replace(/[\s\-_]+/g, '').replace(/[^a-zA-Z0-9]/g, '')
}

/**
 * Get bucketed screen dimensions
 * Floor to nearest 10px for consistency with mobile app
 */
function getScreenDimensions(): string {
  const rawWidth = Math.max(screen.width, screen.height)
  const rawHeight = Math.min(screen.width, screen.height)
  const width = Math.floor(rawWidth / 10) * 10
  const height = Math.floor(rawHeight / 10) * 10
  return `${width}x${height}`
}


/**
 * Get device name for display purposes
 */
function generateDeviceName(): string {
  const userAgent = navigator.userAgent || ''
  
  // Detect if mobile browser
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  const deviceEmoji = isMobile ? '📱' : '💻'
  const deviceType = isMobile ? 'Navigateur Mobile' : 'Navigateur Desktop'
  
  // Detect browser
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

// ============================================================================
// Device ID Functions
// ============================================================================

/**
 * Get or create a persistent device ID for web
 * This should ideally match the mobile app's device ID for the same device
 */
export async function getDeviceId(): Promise<string> {
  try {
    // Check for existing stored device ID
    let deviceId = localStorage.getItem(DEVICE_ID_KEY)
    
    // MIGRATION: If we have an old "unified-" ID, clear it to force new secure format
    if (deviceId && deviceId.startsWith('unified-')) {
      console.log('[DeviceId] Migrating from old unified id...')
      deviceId = null
      localStorage.setItem(DEVICE_ID_KEY, '')
    }

    if (!deviceId) {
      // Generate NEW permanent ID
      deviceId = generatePermanentDeviceId()
      
      // Store for future consistency
      localStorage.setItem(DEVICE_ID_KEY, deviceId)
      
      console.log('[DeviceId] Generated and stored new permanent web device ID:', deviceId)
    }
    
    return deviceId as string
  } catch (error) {
    console.error('[DeviceId] Error getting device ID:', error)
    // Fallback to a one-time ID for this session
    return `web-temp-${Date.now()}`
  }
}


/**
 * Get device name for display
 */
export async function getDeviceName(): Promise<string> {
  return generateDeviceName()
}

/**
 * Clear stored device ID (for testing/debugging)
 */
export function clearDeviceId(): void {
  try {
    localStorage.removeItem(DEVICE_ID_KEY)
    console.log('[DeviceId] Cleared stored device ID')
  } catch (error) {
    console.error('[DeviceId] Error clearing device ID:', error)
  }
}