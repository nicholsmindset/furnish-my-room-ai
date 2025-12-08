// Stripe Product IDs
// These map to products configured in Stripe Dashboard
export const STRIPE_PRODUCTS = {
  pro: "prod_RZkgNtbGJ0eY8j",
  business: "prod_RZkhKK9YPWl8YJ",
} as const;

export type SubscriptionTier = keyof typeof STRIPE_PRODUCTS | "free";

// Credit limits per tier
export const CREDITS_PER_TIER: Record<SubscriptionTier, number> = {
  free: 3,
  pro: 50,
  business: 999999, // Effectively unlimited
} as const;

// Polling intervals (in milliseconds)
export const SUBSCRIPTION_POLL_INTERVAL = 60000; // 1 minute

// Image constraints
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// Share token length
export const SHARE_TOKEN_LENGTH = 16;
