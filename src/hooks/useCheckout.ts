import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { STRIPE_PRODUCTS, SubscriptionTier } from "@/lib/constants";

export function useCheckout() {
  const [loading, setLoading] = useState<string | null>(null);
  const { user, session, subscription } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleUpgrade = async (tier: "pro" | "business") => {
    if (!user || !session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upgrade your subscription.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const productId = STRIPE_PRODUCTS[tier];

    // Check if already on this plan
    if (subscription.subscribed && subscription.product_id === productId) {
      toast({
        title: "Already subscribed",
        description: "You're already on this plan!",
      });
      return;
    }

    setLoading(tier);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { productId },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user || !session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to manage your subscription.",
        variant: "destructive",
      });
      return;
    }

    setLoading("portal");

    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No portal URL received");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast({
        title: "Error",
        description: "Failed to open customer portal.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return {
    loading,
    handleUpgrade,
    handleManageSubscription,
    isCurrentPlan: (productId: string | null) => {
      if (!productId) return !subscription.subscribed;
      return subscription.product_id === productId;
    },
  };
}
