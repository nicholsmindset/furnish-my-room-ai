import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Gift,
  Copy,
  Check,
  Users,
  Coins,
  Share2,
  Twitter,
  Facebook,
  Mail,
} from "lucide-react";

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalCreditsEarned: number;
}

const CREDITS_PER_REFERRAL = 5;

export default function ReferralProgram() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadReferralStats();
    }
  }, [user]);

  const loadReferralStats = async () => {
    try {
      // Get user's referral code
      const { data: creditsData, error: creditsError } = await supabase
        .from("user_credits")
        .select("referral_code")
        .eq("user_id", user?.id)
        .single();

      if (creditsError) throw creditsError;

      // Get referral stats
      const { data: referralsData, error: referralsError } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user?.id);

      if (referralsError && referralsError.code !== "PGRST116") {
        throw referralsError;
      }

      const referrals = referralsData || [];
      const completed = referrals.filter((r) => r.status === "completed");
      const pending = referrals.filter((r) => r.status === "pending");

      setStats({
        referralCode: creditsData?.referral_code || "",
        totalReferrals: referrals.length,
        completedReferrals: completed.length,
        pendingReferrals: pending.length,
        totalCreditsEarned: completed.reduce((sum, r) => sum + (r.credits_awarded || 0), 0),
      });
    } catch (error) {
      console.error("Error loading referral stats:", error);
      toast({
        title: "Error",
        description: "Failed to load referral data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getReferralLink = () => {
    if (!stats?.referralCode) return "";
    return `${window.location.origin}/auth?ref=${stats.referralCode}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink());
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const shareVia = (platform: "twitter" | "facebook" | "email") => {
    const link = getReferralLink();
    const text = `Join me on Noonah Design and get free credits to transform your room with AI! Use my referral link:`;

    let url = "";
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(text)}`;
        break;
      case "email":
        url = `mailto:?subject=${encodeURIComponent("Try Noonah Design - AI Room Transformation")}&body=${encodeURIComponent(`${text}\n\n${link}`)}`;
        break;
    }

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (loading) {
    return (
      <Card className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Gift className="w-5 h-5 text-accent" />
            Referral Program
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Earn {CREDITS_PER_REFERRAL} credits for every friend who signs up and generates their first design
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {stats?.referralCode}
        </Badge>
      </div>

      {/* Referral Link */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Your Referral Link</label>
        <div className="flex gap-2">
          <Input
            value={getReferralLink()}
            readOnly
            className="bg-muted"
          />
          <Button onClick={copyToClipboard} variant="outline" className="shrink-0">
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => shareVia("twitter")}
          className="gap-2"
        >
          <Twitter className="w-4 h-4" />
          Twitter
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => shareVia("facebook")}
          className="gap-2"
        >
          <Facebook className="w-4 h-4" />
          Facebook
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => shareVia("email")}
          className="gap-2"
        >
          <Mail className="w-4 h-4" />
          Email
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
          <p className="text-2xl font-bold">{stats?.totalReferrals || 0}</p>
          <p className="text-xs text-muted-foreground">Total Referrals</p>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <Check className="w-6 h-6 mx-auto mb-2 text-green-500" />
          <p className="text-2xl font-bold">{stats?.completedReferrals || 0}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <Coins className="w-6 h-6 mx-auto mb-2 text-amber-500" />
          <p className="text-2xl font-bold">{stats?.totalCreditsEarned || 0}</p>
          <p className="text-xs text-muted-foreground">Credits Earned</p>
        </div>
      </div>

      {/* How it works */}
      <div className="pt-4 border-t">
        <h4 className="font-medium mb-3">How it works</h4>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
            Share your unique referral link with friends
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
            They sign up using your link and get 3 bonus credits
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
            When they generate their first design, you earn {CREDITS_PER_REFERRAL} credits
          </li>
        </ol>
      </div>
    </Card>
  );
}
