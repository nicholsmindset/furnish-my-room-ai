import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      quote:
        "I used to spend $300 per room and wait two days. Now I stage entire properties in ten minutes for a fraction of the cost. My clients can't tell the difference.",
      author: "Sarah Chen",
      role: "Top 1% Agent, Coldwell Banker",
      initials: "SC",
    },
    {
      quote:
        "Sold a vacant listing in 9 days after it sat for 60 days unstaged. The AI photos changed everything.",
      author: "Marcus Johnson",
      role: "Team Lead, RE/MAX",
      initials: "MJ",
    },
    {
      quote:
        "I show clients design possibilities before they buy. They see themselves living there. It closes deals.",
      author: "Emily Watson",
      role: "Luxury Home Specialist",
      initials: "EW",
    },
  ];

  return (
    <section className="py-20 bg-muted/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Trusted by 12,000+ Real Estate Professionals
          </h2>
          <p className="text-xl text-muted-foreground">
            847,000+ rooms staged and counting
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <Card key={idx} className="border-border hover:shadow-large transition-all">
              <CardContent className="pt-6">
                <Quote className="w-10 h-10 text-accent mb-4 opacity-50" />
                <p className="text-muted-foreground mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
