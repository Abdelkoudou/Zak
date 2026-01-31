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
 * 
 * IMPORTANT: Chrome 110+ uses "reduced" User-Agent that hides device model
 * (shows "K" instead of actual model). To ensure fingerprints match between
 * native app and browser, we use GENERIC categories:
 * 
 * - Android: "Mobile" or "Tablet" (not specific model)
 * - iOS: "iPhone" or "iPad"
 * - Desktop: "Desktop"
 */
function getDeviceModel(): string {
  const ua = navigator.userAgent || ''
  
  // iOS detection
  if (ua.includes('iPad')) return 'iPad'
  if (ua.includes('iPhone')) return 'iPhone'
  
  // Android detection - always use "Mobile" to match native app
  if (ua.includes('Android')) {
    return 'Mobile'
  }
  
  // Desktop detection
  if (ua.includes('Windows') || ua.includes('Macintosh') || ua.includes('Linux')) {
    return 'Desktop'
  }
  
  return 'Unknown'
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