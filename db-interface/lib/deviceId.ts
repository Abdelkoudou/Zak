// ============================================================================
// Device ID Generation - Web Interface
// ============================================================================

// Storage key for device ID (matches mobile app)
const DEVICE_ID_KEY = 'fmc_device_id'

// ============================================================================
// Device ID Generation - Unified Approach
// ============================================================================

/**
 * Generate a device fingerprint that's consistent across platforms
 * This creates a unified ID that should be similar whether accessing
 * via mobile app or web browser on the same device
 */
function generateUnifiedDeviceId(): string {
  // Get screen characteristics (use consistent orientation - always width >= height)
  const screenWidth = Math.max(screen.width, screen.height)  // Always use larger dimension as width
  const screenHeight = Math.min(screen.width, screen.height) // Always use smaller dimension as height
  const screenResolution = `${screenWidth}x${screenHeight}`
  
  // Get OS info
  const userAgent = navigator.userAgent || ''
  let osName = 'Unknown'
  if (userAgent.includes('Windows')) osName = 'Windows'
  else if (userAgent.includes('Mac')) osName = 'macOS'
  else if (userAgent.includes('Linux')) osName = 'Linux'
  else if (userAgent.includes('Android')) osName = 'Android'
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) osName = 'iOS'
  
  // Create a device string that focuses on hardware characteristics
  // This should be similar for mobile app and web browser on same device
  const deviceString = `${osName}-${screenResolution}`
  
  // Create a hash-like string (same algorithm as mobile)
  let hash = 0
  for (let i = 0; i < deviceString.length; i++) {
    const char = deviceString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Convert to positive string - use same format as mobile but with web prefix
  const hashString = Math.abs(hash).toString(36)
  return `unified-${hashString}`
}

/**
 * Get device name for display purposes
 */
function generateDeviceName(): string {
  const userAgent = navigator.userAgent || ''
  
  // Detect browser
  let browser = 'Unknown Browser'
  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'
  
  // Detect OS
  let os = 'Unknown OS'
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS'
  
  return `${browser} sur ${os}`
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
    
    if (!deviceId) {
      // Generate new device ID
      deviceId = generateUnifiedDeviceId()
      
      // Store for future consistency
      localStorage.setItem(DEVICE_ID_KEY, deviceId)
      
      console.log('[DeviceId] Generated and stored web device ID')
    }
    
    return deviceId
  } catch (error) {
    console.error('[DeviceId] Error getting device ID:', error)
    // Fallback to a simple ID
    return `web-fallback-${Date.now()}`
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