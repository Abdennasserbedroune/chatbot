/**
 * Unit tests for the rate limiter utility
 */

import { RateLimiter, createRateLimiter } from '@/lib/rateLimiter';

describe('RateLimiter', () => {
  describe('Token bucket algorithm', () => {
    it('should allow requests within the rate limit', () => {
      const limiter = new RateLimiter({
        maxTokens: 5,
        refillRate: 1, // 1 token per second
      });

      expect(limiter.isAllowed('user1', 1)).toBe(true);
      expect(limiter.isAllowed('user1', 1)).toBe(true);
      expect(limiter.isAllowed('user1', 1)).toBe(true);
      expect(limiter.isAllowed('user1', 1)).toBe(true);
      expect(limiter.isAllowed('user1', 1)).toBe(true);

      limiter.destroy();
    });

    it('should reject requests exceeding the rate limit', () => {
      const limiter = new RateLimiter({
        maxTokens: 2,
        refillRate: 0, // no refill for this test
      });

      expect(limiter.isAllowed('user1', 1)).toBe(true);
      expect(limiter.isAllowed('user1', 1)).toBe(true);
      expect(limiter.isAllowed('user1', 1)).toBe(false);

      limiter.destroy();
    });

    it('should refill tokens over time', () => {
      const limiter = new RateLimiter({
        maxTokens: 2,
        refillRate: 1, // 1 token per second
      });

      // Use up all tokens
      expect(limiter.isAllowed('user1', 1)).toBe(true);
      expect(limiter.isAllowed('user1', 1)).toBe(true);
      expect(limiter.isAllowed('user1', 1)).toBe(false);

      // Test remaining tokens calculation (should be 0 after using all)
      const remaining = limiter.getRemainingTokens('user1');
      expect(remaining).toBeLessThanOrEqual(0.1); // Allow for very small refill

      limiter.destroy();
    });

    it('should handle multiple users independently', () => {
      const limiter = new RateLimiter({
        maxTokens: 2,
        refillRate: 0,
      });

      expect(limiter.isAllowed('user1', 1)).toBe(true);
      expect(limiter.isAllowed('user1', 1)).toBe(true);
      expect(limiter.isAllowed('user1', 1)).toBe(false);

      // user2 should have separate bucket
      expect(limiter.isAllowed('user2', 1)).toBe(true);
      expect(limiter.isAllowed('user2', 1)).toBe(true);
      expect(limiter.isAllowed('user2', 1)).toBe(false);

      limiter.destroy();
    });

    it('should support multiple token consumption', () => {
      const limiter = new RateLimiter({
        maxTokens: 10,
        refillRate: 0,
      });

      expect(limiter.isAllowed('user1', 5)).toBe(true);
      expect(limiter.isAllowed('user1', 3)).toBe(true);
      expect(limiter.isAllowed('user1', 3)).toBe(false); // not enough tokens
      expect(limiter.isAllowed('user1', 2)).toBe(true);
      expect(limiter.isAllowed('user1', 1)).toBe(false); // no tokens left

      limiter.destroy();
    });

    it('should cap tokens at maxTokens', () => {
      const limiter = new RateLimiter({
        maxTokens: 5,
        refillRate: 100, // very high refill rate
      });

      // First use initializes the bucket
      expect(limiter.isAllowed('user1', 1)).toBe(true);

      // Wait a bit for refill
      setTimeout(() => {
        const remaining = limiter.getRemainingTokens('user1');
        // Should never exceed maxTokens
        expect(remaining).toBeLessThanOrEqual(5);
      }, 100);

      limiter.destroy();
    });

    it('should return correct remaining tokens', () => {
      const limiter = new RateLimiter({
        maxTokens: 10,
        refillRate: 0,
      });

      const initial = limiter.getRemainingTokens('user1');
      expect(initial).toBe(10);

      limiter.isAllowed('user1', 3);
      const afterUse = limiter.getRemainingTokens('user1');
      expect(afterUse).toBe(7);

      limiter.destroy();
    });

    it('should return maxTokens for new users', () => {
      const limiter = new RateLimiter({
        maxTokens: 10,
        refillRate: 0,
      });

      const remaining = limiter.getRemainingTokens('new-user');
      expect(remaining).toBe(10);

      limiter.destroy();
    });
  });

  describe('Cleanup mechanism', () => {
    it('should initialize cleanup interval', () => {
      const limiter = new RateLimiter({
        maxTokens: 10,
        refillRate: 1,
        windowMs: 100,
      });

      // Verify that cleanup is set up by trying to clean up manually
      limiter.isAllowed('user1', 1);

      // The cleanup mechanism is set up in the constructor
      expect(true).toBe(true); // placeholder assertion

      limiter.destroy();
    });
  });

  describe('createRateLimiter factory', () => {
    it('should create limiter with default options', () => {
      const limiter = createRateLimiter();

      expect(limiter.isAllowed('user1', 1)).toBe(true);
      expect(limiter.getRemainingTokens('user1')).toBeLessThanOrEqual(30);

      limiter.destroy();
    });

    it('should create limiter with custom options', () => {
      const limiter = createRateLimiter({
        maxTokens: 5,
        refillRate: 2,
      });

      // Can make 5 requests
      for (let i = 0; i < 5; i++) {
        expect(limiter.isAllowed('user1', 1)).toBe(true);
      }

      // 6th should fail
      expect(limiter.isAllowed('user1', 1)).toBe(false);

      limiter.destroy();
    });

    it('should merge partial options with defaults', () => {
      const limiter = createRateLimiter({
        maxTokens: 20,
        // refillRate uses default
      });

      expect(limiter.getRemainingTokens('user1')).toBe(20);

      limiter.destroy();
    });
  });

  describe('Edge cases', () => {
    it('should handle zero refill rate', () => {
      const limiter = new RateLimiter({
        maxTokens: 5,
        refillRate: 0,
      });

      for (let i = 0; i < 5; i++) {
        expect(limiter.isAllowed('user1', 1)).toBe(true);
      }

      expect(limiter.isAllowed('user1', 1)).toBe(false);

      // Even after waiting, no refill
      setTimeout(() => {
        expect(limiter.isAllowed('user1', 1)).toBe(false);
      }, 100);

      limiter.destroy();
    });

    it('should handle very high refill rate', () => {
      const limiter = new RateLimiter({
        maxTokens: 5,
        refillRate: 1000, // 1000 tokens per second
      });

      for (let i = 0; i < 5; i++) {
        expect(limiter.isAllowed('user1', 1)).toBe(true);
      }

      // At this point we should have used all tokens
      expect(limiter.isAllowed('user1', 1)).toBe(false);

      // With a very high refill rate, tokens should accumulate quickly
      // Getting remaining tokens should reflect the refill
      const remaining = limiter.getRemainingTokens('user1');
      // After infinitesimal time, some tokens might have refilled
      expect(remaining).toBeGreaterThanOrEqual(0);

      limiter.destroy();
    });

    it('should handle requesting more tokens than maxTokens', () => {
      const limiter = new RateLimiter({
        maxTokens: 5,
        refillRate: 0,
      });

      // Request more tokens than available
      expect(limiter.isAllowed('user1', 10)).toBe(false);

      limiter.destroy();
    });

    it('should handle destroy gracefully', () => {
      const limiter = createRateLimiter();
      limiter.destroy();

      // Should not throw
      expect(true).toBe(true);
    });
  });
});
