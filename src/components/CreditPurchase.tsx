import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Coins,
  Gift,
  Sparkles,
  Check,
  Loader2,
  CreditCard,
  Zap,
} from "lucide-react";

interface CreditPack {
  id: string;
  credits: number;
  price: number;
  popular?: boolean;
  savings?: number;
}

const CREDIT_PACKS: CreditPack[] = [
  { id: "pack_10", credits: 10, price: 499 },
  { id: "pack_25", credits: 25, price: 999, popular: true, savings: 20 },
  { id: "pack_50", credits: 50, price: 1799, savings: 28 },
  { id: "pack_100", credits: 100, price: 2999, savings: 40 },
];

export default function CreditPurchase() {
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [isGift, setIsGift] = useState(false);
  const [giftEmail, setGiftEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { user, session } = useAuth();
  const { toast } = useToast();

  const handleSelectPack = (pack: CreditPack) => {
    setSelectedPack(pack);
    setShowCheckout(true);
  };

  const handlePurchase = async () => {
    if (!user || !session || !selectedPack) {
      toast({
        title: "Sign in required",
        description: "Please sign in to purchase credits",
        variant: "destructive",
      });
      return;
    }

    if (isGift && !giftEmail) {
      toast({
        title: "Email required",
        description: "Please enter the recipient's email",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-credit-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            packId: selectedPack.id,
            credits: selectedPack.credits,
            priceInCents: selectedPack.price,
            isGift,
            giftEmail: isGift ? giftEmail : undefined,
            giftMessage: isGift ? giftMessage : undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process purchase",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Coins className="w-5 h-5 text-accent" />
          Buy Credits
        </h3>
        <p className="text-muted-foreground text-sm mt-1">
          Purchase credit packs or send as a gift
        </p>
      </div>

      {/* Credit Packs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CREDIT_PACKS.map((pack) => (
          <Card
            key={pack.id}
            className={`relative p-4 cursor-pointer transition-all hover:shadow-md hover:border-accent ${
              selectedPack?.id === pack.id ? "border-accent ring-2 ring-accent/20" : ""
            }`}
            onClick={() => handleSelectPack(pack)}
          >
            {pack.popular && (
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent">
                Most Popular
              </Badge>
            )}
            <div className="text-center space-y-3 pt-2">
              <div className="flex items-center justify-center gap-1">
                <Sparkles className="w-5 h-5 text-accent" />
                <span className="text-3xl font-bold">{pack.credits}</span>
              </div>
              <p className="text-sm text-muted-foreground">credits</p>
              <div>
                <p className="text-2xl font-bold">{formatPrice(pack.price)}</p>
                {pack.savings && (
                  <p className="text-xs text-green-600 font-medium">
                    Save {pack.savings}%
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatPrice(Math.round(pack.price / pack.credits))} per credit
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Complete Purchase
            </DialogTitle>
            <DialogDescription>
              {selectedPack?.credits} credits for {selectedPack && formatPrice(selectedPack.price)}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="self" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="self" onClick={() => setIsGift(false)}>
                <Zap className="w-4 h-4 mr-2" />
                For Me
              </TabsTrigger>
              <TabsTrigger value="gift" onClick={() => setIsGift(true)}>
                <Gift className="w-4 h-4 mr-2" />
                As Gift
              </TabsTrigger>
            </TabsList>

            <TabsContent value="self" className="space-y-4 pt-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credits</span>
                  <span className="font-medium">{selectedPack?.credits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">{selectedPack && formatPrice(selectedPack.price)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Credits will be added to your account immediately after payment
              </p>
            </TabsContent>

            <TabsContent value="gift" className="space-y-4 pt-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="gift-email">Recipient's Email</Label>
                  <Input
                    id="gift-email"
                    type="email"
                    placeholder="friend@example.com"
                    value={giftEmail}
                    onChange={(e) => setGiftEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gift-message">Gift Message (optional)</Label>
                  <Input
                    id="gift-message"
                    placeholder="Enjoy designing your space!"
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Recipient will receive an email with a code to redeem their credits
              </p>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button onClick={handlePurchase} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay {selectedPack && formatPrice(selectedPack.price)}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-sm">No Expiration</p>
            <p className="text-xs text-muted-foreground">Credits never expire</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-sm">Instant Delivery</p>
            <p className="text-xs text-muted-foreground">Credits added immediately</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
            <Gift className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-sm">Gift Option</p>
            <p className="text-xs text-muted-foreground">Send credits to anyone</p>
          </div>
        </div>
      </div>
    </div>
  );
}
