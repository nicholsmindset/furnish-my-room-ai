import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Upload, Home, Clock, ImageIcon, Check } from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";
import { Link } from "react-router-dom";

interface HeroProps {
  onGetStarted: () => void;
  onViewHistory?: () => void;
}

export default function Hero({ onGetStarted, onViewHistory }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBackground}
          alt="Empty room ready for virtual staging"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
        <Badge
          variant="secondary"
          className="mb-6 px-4 py-2 bg-accent/20 text-accent-foreground backdrop-blur-sm border-accent/30 hover:bg-accent/30 transition-colors"
        >
          <Sparkles className="w-4 h-4 mr-2 inline" />
          AI-Powered Virtual Staging
        </Badge>

        <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
          Transform Empty Rooms
          <br />
          Into Dream Homes
        </h1>

        <p className="text-xl md:text-2xl text-primary-foreground/90 mb-10 max-w-3xl mx-auto">
          Professional virtual staging in seconds. Upload your empty room photo and let AI create stunning, 
          photorealistic designs that sell — without the $300-per-room cost, the 48-hour wait, or hiring a designer.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={onGetStarted}
            className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg rounded-lg shadow-large transition-all hover:scale-105"
          >
            <Upload className="w-5 h-5 mr-2" />
            Start Staging Now
          </Button>
          <Link to="/gallery">
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg rounded-lg shadow-large transition-all hover:scale-105 bg-card/10 backdrop-blur-md border-accent/30"
            >
              View Examples
            </Button>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="bg-card/10 backdrop-blur-md rounded-xl p-6 border border-border/20 shadow-medium">
            <Home className="w-8 h-8 text-accent mx-auto mb-3" />
            <div className="text-3xl font-bold text-primary-foreground mb-1">5</div>
            <div className="text-primary-foreground/80">Design Styles</div>
          </div>
          <div className="bg-card/10 backdrop-blur-md rounded-xl p-6 border border-border/20 shadow-medium">
            <Clock className="w-8 h-8 text-accent mx-auto mb-3" />
            <div className="text-3xl font-bold text-primary-foreground mb-1">30s</div>
            <div className="text-primary-foreground/80">Average Time</div>
          </div>
          <div className="bg-card/10 backdrop-blur-md rounded-xl p-6 border border-border/20 shadow-medium">
            <ImageIcon className="w-8 h-8 text-accent mx-auto mb-3" />
            <div className="text-3xl font-bold text-primary-foreground mb-1">4K HD</div>
            <div className="text-primary-foreground/80">Quality</div>
          </div>
        </div>

        {/* Features Showcase */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-primary-foreground mb-8">
            What's Included in Every Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card/20 backdrop-blur-lg border-accent/20">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4 text-primary-foreground">Free</h3>
                <ul className="space-y-3 text-left">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-primary-foreground/90">3 designs/month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-primary-foreground/90">5 design styles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-primary-foreground/90">HD quality</span>
                  </li>
                </ul>
                <Button
                  variant="outline"
                  className="w-full mt-6 bg-background/10 border-accent/30"
                  onClick={onGetStarted}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-accent/30 backdrop-blur-lg border-accent scale-105 shadow-large">
              <CardContent className="pt-6">
                <Badge className="mb-2">Most Popular</Badge>
                <h3 className="text-xl font-bold mb-4 text-primary-foreground">Pro - $29/mo</h3>
                <ul className="space-y-3 text-left">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-primary-foreground/90">50 designs/month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-primary-foreground/90">4K Ultra HD</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-primary-foreground/90">Priority generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-primary-foreground/90">Shareable links</span>
                  </li>
                </ul>
                <Link to="/pricing">
                  <Button className="w-full mt-6 bg-accent hover:bg-accent/90">
                    Upgrade to Pro
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-card/20 backdrop-blur-lg border-accent/20">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4 text-primary-foreground">Business - $99/mo</h3>
                <ul className="space-y-3 text-left">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-primary-foreground/90">Unlimited designs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-primary-foreground/90">8K resolution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-primary-foreground/90">Batch processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-primary-foreground/90">API access</span>
                  </li>
                </ul>
                <Link to="/pricing">
                  <Button
                    variant="outline"
                    className="w-full mt-6 bg-background/10 border-accent/30"
                  >
                    Upgrade to Business
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
