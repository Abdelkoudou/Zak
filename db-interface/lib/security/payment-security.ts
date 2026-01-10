/**
 * Payment Security Utilities
 * 
 * Provides secure functions for payment processing including:
 * - Cryptographically secure activation code generation
 * - Rate limiting
 * - Input validation
 */

import { randomBytes } from 'crypto';

// ============================================================================
// Secure Activation Code Generation
// ============================================================================

/**
 * Generate a cryptographically secure activation code
 * Format: PAY-{8 chars}-{4 chars}
 */
export function generateSecureActivationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (0, O, 1, I)
  const bytes = randomBytes(12);
  
  let code = 'PAY-';
  
  // First 8 characters
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  
  code += '-';
  
  // Last 4 characters
  for (let i = 8; i < 12; i++) {
    code += chars[bytes[i] % chars.length];
  }
  
  return code;
}

// ============================================================================
// Rate Limiting
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory rate limit store (use Redis in production for multi-instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

/**
 * Check if a request should be rate limited
 * @param key - Unique identifier (e.g., IP, email, checkout_id)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if rate limited, false if allowed
 */
export function isRateLimited(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetAt < now) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return false;
  }
  
  if (entry.count >= maxRequests) {
    return true;
  }
  
  entry.count++;
  return false;
}

/**
 * Get remaining requests for a key
 */
export function getRateLimitRemaining(
  key: string,
  maxRequests: number
): number {
  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt < Date.now()) {
    return maxRequests;
  }
  return Math.max(0, maxRequests - entry.count);
}

// ============================================================================
// Input Validation
// ============================================================================

/**
 * Validate Chargily checkout ID format
 * Chargily IDs are typically 26 character ULID-like strings
 */
export function isValidCheckoutId(checkoutId: string): boolean {
  if (!checkoutId || typeof checkoutId !== 'string') {
    return false;
  }
  // Chargily uses ULID format: 26 alphanumeric characters
  // Allow some flexibility for different formats
  return /^[a-zA-Z0-9]{20,32}$/.test(checkoutId);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string | undefined | null): string | null {
  if (!input) return null;
  // Remove control characters and trim
  return input.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 500);
}

/**
 * Validate phone number (Algerian format)
 */
export function isValidPhone(phone: string | undefined | null): boolean {
  if (!phone) return true; // Phone is optional
  // Algerian phone: starts with 0, 10 digits, or +213 format
  return /^(0[567]\d{8}|\+213[567]\d{8})$/.test(phone.replace(/\s/g, ''));
}

// ============================================================================
// Security Headers
// ============================================================================

/**
 * Get security headers for payment responses
 * Following OWASP security best practices
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  };
}

// ============================================================================
// Webhook Security
// ============================================================================

// Chargily webhook IPs (update these based on Chargily documentation)
// For now, we'll rely on signature verification
const CHARGILY_WEBHOOK_IPS: string[] = [
  // Add Chargily's IP addresses here when available
];

/**
 * Check if request is from Chargily (by IP)
 * Note: This is a secondary check; signature verification is primary
 */
export function isChargilyIP(ip: string | null): boolean {
  if (!ip || CHARGILY_WEBHOOK_IPS.length === 0) {
    return true; // Skip IP check if not configured
  }
  return CHARGILY_WEBHOOK_IPS.includes(ip);
}

// ============================================================================
// Constants
// ============================================================================

export const RATE_LIMITS = {
  // Poll endpoint: 60 requests per minute per checkout_id
  POLL_PER_CHECKOUT: { maxRequests: 60, windowMs: 60000 },
  // Create checkout: 10 per hour per email
  CREATE_PER_EMAIL: { maxRequests: 10, windowMs: 3600000 },
  // Create checkout: 100 per hour per IP
  CREATE_PER_IP: { maxRequests: 100, windowMs: 3600000 },
} as const;

export const VALID_DURATIONS = ['365'] as const;
export type ValidDuration = typeof VALID_DURATIONS[number];

export function isValidDuration(duration: string): duration is ValidDuration {
  return VALID_DURATIONS.includes(duration as ValidDuration);
}
