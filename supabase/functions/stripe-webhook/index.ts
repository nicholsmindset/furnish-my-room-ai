import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const STRIPE_PRODUCTS: Record<string, string> = {
  "prod_RZkgNtbGJ0eY8j": "pro",
  "prod_RZkhKK9YPWl8YJ": "business",
};

const CREDITS_PER_TIER: Record<string, number> = {
  free: 3,
  pro: 50,
  business: 999999,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logStep("Webhook signature verification failed", { error: message });
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${message}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Event verified", { type: event.type, id: event.id });

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabaseClient, stripe, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(supabaseClient, stripe, subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabaseClient, stripe, invoice);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(supabaseClient, stripe, invoice);
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function getUserByStripeCustomer(
  supabaseClient: ReturnType<typeof createClient>,
  stripe: Stripe,
  customerId: string
) {
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    throw new Error("Customer has been deleted");
  }

  const email = customer.email;
  if (!email) {
    throw new Error("Customer has no email");
  }

  // Find user by email in profiles
  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .single();

  if (error || !profile) {
    logStep("User not found for customer", { customerId, email });
    return null;
  }

  return { userId: profile.id, email: profile.email };
}

async function handleSubscriptionUpdate(
  supabaseClient: ReturnType<typeof createClient>,
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  logStep("Handling subscription update", {
    subscriptionId: subscription.id,
    status: subscription.status
  });

  const customerId = subscription.customer as string;
  const user = await getUserByStripeCustomer(supabaseClient, stripe, customerId);

  if (!user) {
    logStep("No user found for subscription update");
    return;
  }

  const productId = subscription.items.data[0]?.price.product as string;
  const tier = STRIPE_PRODUCTS[productId] || "free";
  const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
  const isActive = subscription.status === "active" || subscription.status === "trialing";

  logStep("Updating user subscription", {
    userId: user.userId,
    tier,
    isActive,
    productId
  });

  // Update user_subscriptions table
  await supabaseClient
    .from("user_subscriptions")
    .upsert({
      user_id: user.userId,
      stripe_product_id: productId,
      subscription_tier: tier,
      subscription_end: subscriptionEnd,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    });

  // Update user role
  await supabaseClient
    .from("user_roles")
    .upsert({
      user_id: user.userId,
      role: isActive ? tier : "free",
    });

  // Update credits if subscription is active
  if (isActive) {
    await supabaseClient
      .from("user_credits")
      .update({
        credits_remaining: CREDITS_PER_TIER[tier] || 3,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.userId);
  }

  logStep("Subscription update completed", { userId: user.userId, tier });
}

async function handleSubscriptionCanceled(
  supabaseClient: ReturnType<typeof createClient>,
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  logStep("Handling subscription canceled", { subscriptionId: subscription.id });

  const customerId = subscription.customer as string;
  const user = await getUserByStripeCustomer(supabaseClient, stripe, customerId);

  if (!user) {
    logStep("No user found for subscription cancellation");
    return;
  }

  // Update subscription to inactive
  await supabaseClient
    .from("user_subscriptions")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.userId);

  // Downgrade user role to free
  await supabaseClient
    .from("user_roles")
    .update({ role: "free" })
    .eq("user_id", user.userId);

  // Reset credits to free tier
  await supabaseClient
    .from("user_credits")
    .update({
      credits_remaining: CREDITS_PER_TIER.free,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.userId);

  logStep("Subscription canceled, user downgraded to free", { userId: user.userId });

  // Send notification email
  try {
    await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notification-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
      body: JSON.stringify({
        type: "subscription_expiring",
        email: user.email,
        data: {
          userName: user.email.split("@")[0],
          expirationDate: new Date().toLocaleDateString(),
          planName: "Free",
        },
      }),
    });
  } catch (emailError) {
    console.error("Failed to send cancellation email:", emailError);
  }
}

async function handlePaymentFailed(
  supabaseClient: ReturnType<typeof createClient>,
  stripe: Stripe,
  invoice: Stripe.Invoice
) {
  logStep("Handling payment failed", { invoiceId: invoice.id });

  if (!invoice.customer) {
    logStep("No customer on invoice");
    return;
  }

  const customerId = invoice.customer as string;
  const user = await getUserByStripeCustomer(supabaseClient, stripe, customerId);

  if (!user) {
    logStep("No user found for failed payment");
    return;
  }

  // Log the failed payment
  await supabaseClient
    .from("usage_logs")
    .insert({
      user_id: user.userId,
      action_type: "payment_failed",
      credits_cost: 0,
      metadata: {
        invoice_id: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
      },
    });

  logStep("Payment failure logged", { userId: user.userId, invoiceId: invoice.id });

  // Note: Consider sending a payment failed email notification here
}

async function handlePaymentSucceeded(
  supabaseClient: ReturnType<typeof createClient>,
  stripe: Stripe,
  invoice: Stripe.Invoice
) {
  logStep("Handling payment succeeded", { invoiceId: invoice.id });

  if (!invoice.customer) {
    logStep("No customer on invoice");
    return;
  }

  const customerId = invoice.customer as string;
  const user = await getUserByStripeCustomer(supabaseClient, stripe, customerId);

  if (!user) {
    logStep("No user found for successful payment");
    return;
  }

  // Log the successful payment
  await supabaseClient
    .from("usage_logs")
    .insert({
      user_id: user.userId,
      action_type: "payment_succeeded",
      credits_cost: 0,
      metadata: {
        invoice_id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
      },
    });

  // Send payment successful email
  try {
    const subscriptionId = invoice.subscription;
    let planName = "Unknown";
    let nextBillingDate = "";

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
      const productId = subscription.items.data[0]?.price.product as string;
      planName = (STRIPE_PRODUCTS[productId] || "free").charAt(0).toUpperCase() +
                 (STRIPE_PRODUCTS[productId] || "free").slice(1);
      nextBillingDate = new Date(subscription.current_period_end * 1000).toLocaleDateString();
    }

    await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notification-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
      body: JSON.stringify({
        type: "payment_successful",
        email: user.email,
        data: {
          userName: user.email.split("@")[0],
          planName,
          amount: `$${(invoice.amount_paid / 100).toFixed(2)}`,
          nextBillingDate,
        },
      }),
    });
  } catch (emailError) {
    console.error("Failed to send payment success email:", emailError);
  }

  logStep("Payment success processed", { userId: user.userId, invoiceId: invoice.id });
}
