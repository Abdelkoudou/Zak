/**
 * Simple in-memory rate limiter for API protection
 * Prevents abuse and DoS attacks by limiting requests per IP
 */

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

// In-memory store (resets on server restart - use Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const WINDOW_MS = 60 * 1000; // 1 minute window

// Adjusted for 9 concurrent managers adding content
const MAX_REQUESTS: Record<string, number> = {
  default: 200,  // 200 requests per minute (reads, listing)
  auth: 20,      // 20 auth attempts per minute
  export: 10,    // 10 exports per minute
  write: 150,    // 150 write operations per minute (~16 per manager)
};

/**
 * Check if request should be rate limited
 * @param request - The incoming request
 * @param type - Type of rate limit to apply
 * @returns Object with rateLimited status and remaining requests
 */
export async function checkRateLimit(
  request: Request,
  type: keyof typeof MAX_REQUESTS = 'default'
): Promise<{ rateLimited: boolean; remaining: number }> {
  // Get client identifier from headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
  
  const key = `${type}:${ip}`;
  const now = Date.now();
  const limit = MAX_REQUESTS[type] || MAX_REQUESTS.default;

  let entry = rateLimitStore.get(key);

  // Reset if window expired
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + WINDOW_MS };
  }

  entry.count++;
  rateLimitStore.set(key, entry);

  // Cleanup old entries periodically (1% chance per request)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries(now);
  }

  return {
    rateLimited: entry.count > limit,
    remaining: Math.max(0, limit - entry.count),
  };
}

/**
 * Remove expired entries from the store
 */
function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  remaining: number,
  type: keyof typeof MAX_REQUESTS = 'default'
): Record<string, string> {
  const limit = MAX_REQUESTS[type] || MAX_REQUESTS.default;
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + 60).toString(),
  };
}
