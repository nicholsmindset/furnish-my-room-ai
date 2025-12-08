import { describe, it, expect } from 'vitest';
import {
  STRIPE_PRODUCTS,
  CREDITS_PER_TIER,
  SUBSCRIPTION_POLL_INTERVAL,
  MAX_IMAGE_SIZE_MB,
  MAX_IMAGE_SIZE_BYTES,
  SHARE_TOKEN_LENGTH,
} from './constants';

describe('Constants', () => {
  describe('STRIPE_PRODUCTS', () => {
    it('should have pro and business product IDs', () => {
      expect(STRIPE_PRODUCTS.pro).toBeDefined();
      expect(STRIPE_PRODUCTS.business).toBeDefined();
      expect(typeof STRIPE_PRODUCTS.pro).toBe('string');
      expect(typeof STRIPE_PRODUCTS.business).toBe('string');
    });
  });

  describe('CREDITS_PER_TIER', () => {
    it('should have credits for all tiers', () => {
      expect(CREDITS_PER_TIER.free).toBe(3);
      expect(CREDITS_PER_TIER.pro).toBe(50);
      expect(CREDITS_PER_TIER.business).toBe(999999);
    });

    it('should have increasing credits per tier', () => {
      expect(CREDITS_PER_TIER.pro).toBeGreaterThan(CREDITS_PER_TIER.free);
      expect(CREDITS_PER_TIER.business).toBeGreaterThan(CREDITS_PER_TIER.pro);
    });
  });

  describe('Configuration values', () => {
    it('should have valid subscription poll interval', () => {
      expect(SUBSCRIPTION_POLL_INTERVAL).toBe(60000);
      expect(SUBSCRIPTION_POLL_INTERVAL).toBeGreaterThan(0);
    });

    it('should have valid image size constraints', () => {
      expect(MAX_IMAGE_SIZE_MB).toBe(10);
      expect(MAX_IMAGE_SIZE_BYTES).toBe(10 * 1024 * 1024);
    });

    it('should have valid share token length', () => {
      expect(SHARE_TOKEN_LENGTH).toBe(16);
      expect(SHARE_TOKEN_LENGTH).toBeGreaterThanOrEqual(12);
    });
  });
});
