import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import React from "https://esm.sh/react@18.3.1";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22";
import { PaymentSuccessfulEmail } from "./_templates/payment-successful.tsx";
import { CreditsLowEmail } from "./_templates/credits-low.tsx";
import { SubscriptionExpiringEmail } from "./_templates/subscription-expiring.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "payment_successful" | "credits_low" | "subscription_expiring";
  email: string;
  data: {
    userName: string;
    planName?: string;
    amount?: string;
    nextBillingDate?: string;
    creditsRemaining?: number;
    expirationDate?: string;
    daysRemaining?: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, data }: NotificationRequest = await req.json();

    let html: string;
    let subject: string;

    switch (type) {
      case "payment_successful":
        html = await renderAsync(
          React.createElement(PaymentSuccessfulEmail, {
            userName: data.userName,
            planName: data.planName || "Pro",
            amount: data.amount || "$29.00",
            nextBillingDate: data.nextBillingDate || "Next month",
          })
        );
        subject = "Payment Successful - Welcome to RoomReimagine!";
        break;

      case "credits_low":
        html = await renderAsync(
          React.createElement(CreditsLowEmail, {
            userName: data.userName,
            creditsRemaining: data.creditsRemaining || 5,
            planName: data.planName || "Free",
          })
        );
        subject = "Your RoomReimagine Credits Are Running Low";
        break;

      case "subscription_expiring":
        html = await renderAsync(
          React.createElement(SubscriptionExpiringEmail, {
            userName: data.userName,
            planName: data.planName || "Pro",
            expirationDate: data.expirationDate || "Soon",
            daysRemaining: data.daysRemaining || 7,
          })
        );
        subject = "Your RoomReimagine Subscription Is Expiring Soon";
        break;

      default:
        throw new Error("Invalid notification type");
    }

    const { error } = await resend.emails.send({
      from: "RoomReimagine <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Email sent successfully:", type, "to", email);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
