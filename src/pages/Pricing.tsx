import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out virtual staging",
    icon: Sparkles,
    features: [
      "3 designs per month",
      "5 design styles",
      "HD quality (1080p)",
      "Basic room types",
      "Download as PNG",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "For real estate professionals",
    icon: Zap,
    features: [
      "50 designs per month",
      "All 5 design styles",
      "4K Ultra HD quality",
      "All room types",
      "Download in PNG/JPG/WebP",
      "Custom style parameters",
      "Priority generation",
      "Favorites & bookmarks",
      "Design history",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Business",
    price: "$99",
    period: "per month",
    description: "For agencies and teams",
    icon: Crown,
    features: [
      "Unlimited designs",
      "All Pro features",
      "8K resolution",
      "Custom branding",
      "API access",
      "Team collaboration",
      "Priority support",
      "Bulk processing",
      "White-label exports",
    ],
    cta: "Upgrade to Business",
    popular: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSelectPlan = (planName: string) => {
    if (!user && planName !== "Free") {
      navigate("/auth");
    } else {
      // TODO: Implement Stripe checkout
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <Badge variant="secondary" className="mb-4 px-4 py-2 bg-accent/20 text-accent-foreground backdrop-blur-sm border-accent/30">
          <Sparkles className="w-4 h-4 mr-2 inline" />
          Simple, Transparent Pricing
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          Choose Your Perfect Plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Transform empty rooms into stunning spaces. Start free, upgrade when you need more.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${
                  plan.popular
                    ? "border-2 border-accent shadow-large scale-105"
                    : "border-border"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="bg-accent text-accent-foreground px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8 pt-8">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">/ {plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                    onClick={() => handleSelectPlan(plan.name)}
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I upgrade or downgrade anytime?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect immediately.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What happens if I exceed my monthly limit?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                On the Free plan, you'll need to upgrade to continue. On paid plans, you can purchase additional credits or upgrade to the next tier.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Do unused designs roll over?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No, design credits reset monthly. However, Business plan users have unlimited designs year-round.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-accent/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Ready to Transform Your Listings?</CardTitle>
            <CardDescription className="text-lg mt-2">
              Join thousands of real estate professionals using RoomReimagine
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="px-8">
              Start Free Trial
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
