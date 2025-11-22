import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Upload, Home, Clock, ImageIcon } from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";

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

        <p className="text-xl md:text-2xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto">
          Professional virtual staging in seconds. Upload your empty room photo and let AI create stunning, photorealistic designs.
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
          {onViewHistory && (
            <Button
              size="lg"
              variant="outline"
              onClick={onViewHistory}
              className="px-8 py-6 text-lg rounded-lg shadow-large transition-all hover:scale-105 bg-card/10 backdrop-blur-md border-accent/30"
            >
              View History
            </Button>
          )}
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
      </div>
    </section>
  );
}
