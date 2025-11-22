import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get all active subscriptions expiring in the next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: subscriptions, error } = await supabaseClient
      .from("user_subscriptions")
      .select("user_id, subscription_tier, subscription_end")
      .eq("is_active", true)
      .lte("subscription_end", sevenDaysFromNow.toISOString());

    if (error) throw error;

    console.log(`Found ${subscriptions?.length || 0} expiring subscriptions`);

    for (const sub of subscriptions || []) {
      // Get user email
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("email")
        .eq("id", sub.user_id)
        .single();

      if (!profile?.email) continue;

      const expirationDate = new Date(sub.subscription_end);
      const daysRemaining = Math.ceil(
        (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      // Send expiring notification
      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notification-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            type: "subscription_expiring",
            email: profile.email,
            data: {
              userName: profile.email.split("@")[0],
              planName: sub.subscription_tier.charAt(0).toUpperCase() + sub.subscription_tier.slice(1),
              expirationDate: expirationDate.toLocaleDateString(),
              daysRemaining,
            },
          }),
        });

        console.log(`Sent expiring notification to ${profile.email}`);
      } catch (emailError) {
        console.error("Failed to send expiring email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: subscriptions?.length || 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error checking expiring subscriptions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
