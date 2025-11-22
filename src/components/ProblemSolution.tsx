import { Card, CardContent } from "@/components/ui/card";

export default function ProblemSolution() {
  return (
    <section className="py-20 bg-muted/20">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-6">
          Stop Losing Buyers to Empty Rooms
        </h2>
        <Card className="border-accent/20 shadow-large">
          <CardContent className="pt-6">
            <p className="text-lg text-muted-foreground mb-6">
              Staged homes sell <strong className="text-foreground">73% faster</strong> and for up to{" "}
              <strong className="text-foreground">25% more</strong>. But traditional staging costs{" "}
              <strong className="text-foreground">$2,000-$5,000 per property</strong>, takes days to coordinate, and
              requires furniture rental, movers, and scheduling headaches.
            </p>
            <p className="text-2xl font-bold text-accent mb-6">
              There's a better way.
            </p>
            <p className="text-lg text-muted-foreground">
              Upload your photo. Pick a style. Download photorealistic results in{" "}
              <strong className="text-foreground">30 seconds</strong>. No furniture. No movers. No design degree required.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
