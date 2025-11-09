/**
 * In-memory rate limiter using token bucket algorithm
 * Keyed by IP address or session identifier
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

interface RateLimiterOptions {
  maxTokens: number;
  refillRate: number; // tokens per second
  windowMs?: number; // optional: cleanup window in milliseconds
}

class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private maxTokens: number;
  private refillRate: number;
  private windowMs: number;
  private cleanupInterval?: ReturnType<typeof setInterval>;

  constructor(options: RateLimiterOptions) {
    this.maxTokens = options.maxTokens;
    this.refillRate = options.refillRate;
    this.windowMs = options.windowMs || 60000; // default 1 minute

    // Cleanup old buckets periodically to prevent memory leaks
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, this.windowMs);
    }
  }

  private refillBucket(bucket: TokenBucket): void {
    const now = Date.now();
    const timePassed = (now - bucket.lastRefill) / 1000; // convert to seconds
    const tokensToAdd = timePassed * this.refillRate;
    bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  isAllowed(key: string, tokensNeeded: number = 1): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = {
        tokens: this.maxTokens,
        lastRefill: now,
      };
      this.buckets.set(key, bucket);
    }

    this.refillBucket(bucket);

    if (bucket.tokens >= tokensNeeded) {
      bucket.tokens -= tokensNeeded;
      return true;
    }

    return false;
  }

  getRemainingTokens(key: string): number {
    const bucket = this.buckets.get(key);
    if (!bucket) {
      return this.maxTokens;
    }

    const now = Date.now();
    const timePassed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    return Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, bucket] of this.buckets.entries()) {
      // Remove buckets that haven't been used in the last window
      if (now - bucket.lastRefill > this.windowMs * 2) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.buckets.delete(key));
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.buckets.clear();
  }
}

// Create singleton instance with sensible defaults
// 10 requests per minute per IP
export const createRateLimiter = (options?: Partial<RateLimiterOptions>): RateLimiter => {
  return new RateLimiter({
    maxTokens: 10,
    refillRate: 10 / 60, // 10 tokens per minute
    ...options,
  });
};

// For testing purposes, export the class
export { RateLimiter };
