import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STRIPE_PRODUCTS = {
  "prod_RZkgNtbGJ0eY8j": {
    price_id: "price_1SWFgsDjNCv7xF612MNXPijT",
    tier: "pro",
  },
  "prod_RZkhKK9YPWl8YJ": {
    price_id: "price_1SWFjqDjNCv7xF61WBYqiVY1",
    tier: "business",
  },
};

serve(async (req) => {
  console.log('[CREATE-CHECKOUT] Function invoked');
  
  if (req.method === "OPTIONS") {
    console.log('[CREATE-CHECKOUT] Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const body = await req.json();
    console.log('[CREATE-CHECKOUT] Request body:', body);
    const { productId } = body;
    
    if (!productId || !STRIPE_PRODUCTS[productId as keyof typeof STRIPE_PRODUCTS]) {
      console.error('[CREATE-CHECKOUT] Invalid product ID:', productId);
      throw new Error("Invalid product ID");
    }
    console.log('[CREATE-CHECKOUT] Valid product ID:', productId);

    const authHeader = req.headers.get("Authorization");
    console.log('[CREATE-CHECKOUT] Auth header present:', !!authHeader);
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    console.log('[CREATE-CHECKOUT] User email:', user?.email);
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log('[CREATE-CHECKOUT] Stripe key present:', !!stripeKey);
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    console.log('[CREATE-CHECKOUT] Looking for customer with email:', user.email);
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('[CREATE-CHECKOUT] Found existing customer:', customerId);
    } else {
      console.log('[CREATE-CHECKOUT] No existing customer found');
    }

    const productInfo = STRIPE_PRODUCTS[productId as keyof typeof STRIPE_PRODUCTS];
    console.log('[CREATE-CHECKOUT] Product info:', productInfo);

    console.log('[CREATE-CHECKOUT] Creating checkout session...');
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: productInfo.price_id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/dashboard`,
      cancel_url: `${req.headers.get("origin")}/pricing`,
    });

    console.log('[CREATE-CHECKOUT] Session created:', session.id);
    console.log('[CREATE-CHECKOUT] Session URL:', session.url);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('[CREATE-CHECKOUT] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
