type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSec: number };

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

export function rateLimitHeaders(result: RateLimitResult, limit: number): HeadersInit {
  if (result.allowed) {
    return { "X-RateLimit-Remaining": String(result.remaining) };
  }
  return { "Retry-After": String(result.retryAfterSec) };
}
