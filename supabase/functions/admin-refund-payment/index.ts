import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-REFUND] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const adminUser = userData.user;
    if (!adminUser) throw new Error("User not authenticated");
    logStep("Admin user authenticated", { userId: adminUser.id });

    // Check if user is admin
    const { data: adminRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !adminRole) {
      throw new Error("Access denied. Admin role required.");
    }
    logStep("Admin role verified");

    const { payment_intent_id, amount, reason } = await req.json();
    if (!payment_intent_id) throw new Error("payment_intent_id is required");

    logStep("Processing refund", { payment_intent_id, amount, reason });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const refundParams: any = {
      payment_intent: payment_intent_id,
    };

    if (amount) {
      refundParams.amount = amount;
    }

    if (reason) {
      refundParams.reason = reason;
    }

    const refund = await stripe.refunds.create(refundParams);
    logStep("Refund created successfully", { refundId: refund.id, status: refund.status });

    return new Response(JSON.stringify({ 
      success: true, 
      refund_id: refund.id,
      status: refund.status,
      amount: refund.amount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in admin-refund-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});