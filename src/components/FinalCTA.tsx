import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload } from "lucide-react";

interface FinalCTAProps {
  onGetStarted: () => void;
}

export default function FinalCTA({ onGetStarted }: FinalCTAProps) {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-4xl mx-auto px-6">
        <Card className="border-accent/20 shadow-large bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-4xl mb-4">
              Ready to Transform Your Listings?
            </CardTitle>
            <CardDescription className="text-xl">
              Start staging for free. No credit card required.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              onClick={onGetStarted}
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-12 py-6 text-lg rounded-lg shadow-large transition-all hover:scale-105"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Your First Photo
            </Button>
            <p className="text-sm text-muted-foreground">
              Join 847 agents who signed up this month
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
