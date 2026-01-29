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
 * It's based on OS and Screen Resolution.
 */
export function getDeviceFingerprint(): string {
  // Get screen characteristics (use consistent orientation - always width >= height)
  const screenWidth = Math.max(screen.width, screen.height)
  const screenHeight = Math.min(screen.width, screen.height)
  const screenResolution = `${screenWidth}x${screenHeight}`
  
  // Get simplified OS name for consistency with mobile app
  const userAgent = navigator.userAgent || ''
  let osName = 'Unknown'
  
  if (userAgent.includes('Android')) osName = 'Android'
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) osName = 'iOS'
  else if (userAgent.includes('Windows')) osName = 'Windows'
  else if (userAgent.includes('Mac')) osName = 'macOS'
  else if (userAgent.includes('Linux')) osName = 'Linux'
  
  return `${osName}-${screenResolution}`
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
  if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) browserName = 'Chrome'
  else if (userAgent.includes('Firefox')) browserName = 'Firefox'
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browserName = 'Safari'
  else if (userAgent.includes('Edge')) browserName = 'Edge'
  
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