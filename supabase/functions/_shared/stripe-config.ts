// Stripe product configuration
// These are read from environment variables in production
// Set STRIPE_PRO_PRODUCT_ID, STRIPE_PRO_PRICE_ID, etc.

export interface StripeProduct {
  productId: string;
  priceId: string;
  tier: "pro" | "business";
  monthlyPrice: number;
  credits: number;
}

export function getStripeProducts(): Record<string, StripeProduct> {
  const proProductId = Deno.env.get("STRIPE_PRO_PRODUCT_ID") || "prod_RZkgNtbGJ0eY8j";
  const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID") || "price_1SWFgsDjNCv7xF612MNXPijT";
  const businessProductId = Deno.env.get("STRIPE_BUSINESS_PRODUCT_ID") || "prod_RZkhKK9YPWl8YJ";
  const businessPriceId = Deno.env.get("STRIPE_BUSINESS_PRICE_ID") || "price_1SWFjqDjNCv7xF61WBYqiVY1";

  return {
    [proProductId]: {
      productId: proProductId,
      priceId: proPriceId,
      tier: "pro",
      monthlyPrice: 29,
      credits: 50,
    },
    [businessProductId]: {
      productId: businessProductId,
      priceId: businessPriceId,
      tier: "business",
      monthlyPrice: 99,
      credits: 999999,
    },
  };
}

export function getProductByTier(tier: "pro" | "business"): StripeProduct | undefined {
  const products = getStripeProducts();
  return Object.values(products).find(p => p.tier === tier);
}

export function getTierByProductId(productId: string): string {
  const products = getStripeProducts();
  return products[productId]?.tier || "free";
}
