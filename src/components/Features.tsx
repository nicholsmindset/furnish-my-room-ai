import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Sparkles, Palette } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: Clock,
      title: "Instant Results",
      description:
        "Get professionally staged photos in under 30 seconds. No more waiting 48-72 hours for a designer to return your files.",
    },
    {
      icon: Sparkles,
      title: "Photorealistic Quality",
      description:
        "AI-generated furniture that matches lighting, shadows, and room dimensions. 94% of viewers cannot distinguish from real staging.",
    },
    {
      icon: Palette,
      title: "Multiple Styles",
      description:
        "Choose from 5 curated design aesthetics to match any listing — from sleek urban condos to cozy family homes.",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why Professionals Choose AI Staging</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <Card key={idx} className="border-border hover:shadow-large transition-all">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
