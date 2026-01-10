// ============================================================================
// Unified Device ID System
// ============================================================================

/**
 * This module creates device IDs that are more likely to be the same
 * when the same physical device accesses via mobile app or web browser
 */

// Storage key for device ID (matches mobile app)
const DEVICE_ID_KEY = 'fmc_device_id'
const DEVICE_FINGERPRINT_KEY = 'fmc_device_fingerprint'

// ============================================================================
// Device Fingerprinting
// ============================================================================

/**
 * Generate a device fingerprint based on hardware characteristics
 * This should be similar across platforms on the same device
 */
function generateDeviceFingerprint(): string {
  const userAgent = navigator.userAgent || ''
  const screenResolution = `${screen.width}x${screen.height}`
  const colorDepth = screen.colorDepth || 24
  const pixelRatio = window.devicePixelRatio || 1
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  
  // Detect OS (to match mobile app's approach)
  let osName = 'Unknown'
  if (userAgent.includes('Windows')) osName = 'Windows'
  else if (userAgent.includes('Mac')) osName = 'macOS'  
  else if (userAgent.includes('Linux')) osName = 'Linux'
  else if (userAgent.includes('Android')) osName = 'Android'
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) osName = 'iOS'
  
  // Create fingerprint focusing on hardware characteristics
  const fingerprint = `${osName}|${screenResolution}|${colorDepth}|${pixelRatio}|${timezone}`
  
  // Create hash
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  return Math.abs(hash).toString(36)
}

/**
 * Check if this device might be the same as an existing mobile device
 * by comparing device fingerprints
 */
async function findSimilarDevice(userId: string, currentFingerprint: string): Promise<string | null> {
  try {
    // This would require an API call to check existing device sessions
    // For now, we'll implement a simple approach
    
    // Get existing device sessions for this user
    const response = await fetch('/api/device-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, fingerprint: currentFingerprint })
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.matchingDeviceId || null
    }
    
    return null
  } catch (error) {
    console.warn('[UnifiedDeviceId] Failed to check for similar devices:', error)
    return null
  }
}

// ============================================================================
// Unified Device ID Functions
// ============================================================================

/**
 * Get or create a device ID that attempts to unify mobile and web access
 * from the same physical device
 */
export async function getUnifiedDeviceId(userId?: string): Promise<string> {
  try {
    // Check for existing stored device ID
    let deviceId = localStorage.getItem(DEVICE_ID_KEY)
    let storedFingerprint = localStorage.getItem(DEVICE_FINGERPRINT_KEY)
    
    const currentFingerprint = generateDeviceFingerprint()
    
    // If we have a stored ID and the fingerprint hasn't changed significantly, use it
    if (deviceId && storedFingerprint === currentFingerprint) {
      return deviceId
    }
    
    // If we have a user ID, try to find a similar device
    if (userId) {
      const similarDeviceId = await findSimilarDevice(userId, currentFingerprint)
      if (similarDeviceId) {
        // Use the existing device ID from mobile app
        localStorage.setItem(DEVICE_ID_KEY, similarDeviceId)
        localStorage.setItem(DEVICE_FINGERPRINT_KEY, currentFingerprint)
        return similarDeviceId
      }
    }
    
    // Generate new device ID if no match found
    if (!deviceId) {
      deviceId = `web-${currentFingerprint}-${Date.now().toString(36).slice(-4)}`
      localStorage.setItem(DEVICE_ID_KEY, deviceId)
    }
    
    // Update fingerprint
    localStorage.setItem(DEVICE_FINGERPRINT_KEY, currentFingerprint)
    
    return deviceId
  } catch (error) {
    console.error('[UnifiedDeviceId] Error getting device ID:', error)
    // Fallback to simple ID
    return `web-fallback-${Date.now()}`
  }
}

/**
 * Clear stored device ID (for testing/debugging)
 */
export function clearUnifiedDeviceId(): void {
  try {
    localStorage.removeItem(DEVICE_ID_KEY)
    localStorage.removeItem(DEVICE_FINGERPRINT_KEY)
    console.log('[UnifiedDeviceId] Cleared stored device data')
  } catch (error) {
    console.error('[UnifiedDeviceId] Error clearing device data:', error)
  }
}