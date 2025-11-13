/**
 * In-memory rate limiter for API endpoints
 * Tracks requests by IP address with configurable limits
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  success: boolean;
  retryAfter: number;
  remaining: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// Rate limit configurations for different endpoint types
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  general: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
} as const;

// In-memory store for rate limit data
// In production, consider using Redis for multi-server deployments
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries from the rate limit store
 * This prevents memory leaks from accumulating old entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Extract client IP address from request headers
 * Handles various proxy configurations
 */
function getClientIP(request: Request): string {
  // Check common headers for real IP (works with proxies/load balancers)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Check for Cloudflare connecting IP
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a default identifier
  return "unknown";
}

/**
 * Check if a request should be rate limited
 * @param request - The incoming request
 * @param limitType - The type of rate limit to apply ('auth' or 'general')
 * @returns Rate limit result with success status and retry information
 */
export async function checkRateLimit(
  request: Request,
  limitType: keyof typeof RATE_LIMIT_CONFIGS = "general"
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[limitType];
  const clientIP = getClientIP(request);
  const key = `${limitType}:${clientIP}`;
  const now = Date.now();

  // Clean up expired entries periodically (every 100 requests)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  // Get or create rate limit entry for this client
  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      success: true,
      retryAfter: 0,
      remaining: config.maxRequests - 1,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      success: false,
      retryAfter,
      remaining: 0,
    };
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    retryAfter: 0,
    remaining: config.maxRequests - entry.count,
  };
}

/**
 * Get current rate limit status for a client without incrementing
 * Useful for debugging or monitoring
 */
export function getRateLimitStatus(
  request: Request,
  limitType: keyof typeof RATE_LIMIT_CONFIGS = "general"
): {
  count: number;
  limit: number;
  remaining: number;
  resetTime: number;
} {
  const config = RATE_LIMIT_CONFIGS[limitType];
  const clientIP = getClientIP(request);
  const key = `${limitType}:${clientIP}`;
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return {
      count: 0,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
    };
  }

  return {
    count: entry.count,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * Reset rate limit for a specific client (useful for testing or admin override)
 */
export function resetRateLimit(
  request: Request,
  limitType: keyof typeof RATE_LIMIT_CONFIGS = "general"
): void {
  const clientIP = getClientIP(request);
  const key = `${limitType}:${clientIP}`;
  rateLimitStore.delete(key);
}

/**
 * Get statistics about the rate limiter (for monitoring)
 */
export function getRateLimiterStats(): {
  totalEntries: number;
  authEntries: number;
  generalEntries: number;
} {
  let authEntries = 0;
  let generalEntries = 0;

  for (const key of rateLimitStore.keys()) {
    if (key.startsWith("auth:")) {
      authEntries++;
    } else if (key.startsWith("general:")) {
      generalEntries++;
    }
  }

  return {
    totalEntries: rateLimitStore.size,
    authEntries,
    generalEntries,
  };
}
