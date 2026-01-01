// ============================================================================
// Validation Utilities - Security & Input Validation
// ============================================================================

/**
 * Email validation regex - RFC 5322 compliant (simplified)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Password requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean
  error: string | null
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim()
  
  if (!trimmed) {
    return { isValid: false, error: 'Veuillez entrer votre adresse email' }
  }
  
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Veuillez entrer une adresse email valide' }
  }
  
  return { isValid: true, error: null }
}

/**
 * Validate password strength
 * Returns detailed error message for missing requirements
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Veuillez entrer un mot de passe' }
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Le mot de passe doit contenir au moins 8 caractères' }
  }
  
  const errors: string[] = []
  
  if (!/[a-z]/.test(password)) {
    errors.push('une minuscule')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('une majuscule')
  }
  
  if (!/\d/.test(password)) {
    errors.push('un chiffre')
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('un caractère spécial (!@#$%^&*...)')
  }
  
  if (errors.length > 0) {
    return {
      isValid: false,
      error: `Le mot de passe doit contenir ${errors.join(', ')}`
    }
  }
  
  return { isValid: true, error: null }
}

/**
 * Validate password confirmation matches
 */
export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Les mots de passe ne correspondent pas' }
  }
  
  return { isValid: true, error: null }
}

/**
 * Validate activation code - flexible format validation
 * Codes can have various formats (MCQ-XXXXXXXX, TEST-DEV-XXX, etc.)
 * Just checks it's not empty and has reasonable length
 */
export function validateActivationCode(code: string): ValidationResult {
  const trimmed = code.trim()
  
  if (!trimmed) {
    return { isValid: false, error: 'Veuillez entrer votre code d\'activation' }
  }
  
  // Minimum length check (codes are typically at least 6 characters)
  if (trimmed.length < 6) {
    return { 
      isValid: false, 
      error: 'Le code d\'activation semble trop court' 
    }
  }
  
  return { isValid: true, error: null }
}

/**
 * Validate required text field
 */
export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value.trim()) {
    return { isValid: false, error: `Veuillez entrer ${fieldName}` }
  }
  
  return { isValid: true, error: null }
}

/**
 * Validate selection field
 */
export function validateSelection(value: string | undefined, fieldName: string): ValidationResult {
  if (!value) {
    return { isValid: false, error: `Veuillez sélectionner ${fieldName}` }
  }
  
  return { isValid: true, error: null }
}

// ============================================================================
// Password Strength Indicator
// ============================================================================

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

export interface PasswordStrengthResult {
  strength: PasswordStrength
  score: number // 0-4
  label: string
  color: string
}

/**
 * Calculate password strength for UI feedback
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
  let score = 0
  
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++
  
  // Cap at 4
  score = Math.min(score, 4)
  
  const strengths: Record<number, PasswordStrengthResult> = {
    0: { strength: 'weak', score: 0, label: 'Très faible', color: '#EF4444' },
    1: { strength: 'weak', score: 1, label: 'Faible', color: '#F97316' },
    2: { strength: 'fair', score: 2, label: 'Moyen', color: '#EAB308' },
    3: { strength: 'good', score: 3, label: 'Bon', color: '#22C55E' },
    4: { strength: 'strong', score: 4, label: 'Excellent', color: '#10B981' },
  }
  
  return strengths[score]
}

// ============================================================================
// Sanitization Functions
// ============================================================================

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Sanitize activation code
 */
export function sanitizeActivationCode(code: string): string {
  return code.trim().toUpperCase()
}

/**
 * Sanitize general text input (trim whitespace)
 */
export function sanitizeText(text: string): string {
  return text.trim()
}
