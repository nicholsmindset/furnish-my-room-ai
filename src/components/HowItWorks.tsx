import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Palette, Download } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      number: "1",
      title: "Upload Photo",
      description:
        "Drag and drop your empty room photo or take one directly from your phone. Works with any smartphone or DSLR image.",
    },
    {
      icon: Palette,
      number: "2",
      title: "Choose Style",
      description:
        "Select from 5 professionally designed interior styles that match your listing's character and target buyer.",
    },
    {
      icon: Download,
      number: "3",
      title: "Download & Share",
      description:
        "Get your 4K staged photo in 30 seconds. Ready for MLS, social media, listing presentations, and print.",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Stage Any Room in 3 Simple Steps</h2>
          <p className="text-xl text-muted-foreground">
            No design skills required. Just upload and transform.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <Card key={idx} className="border-border hover:shadow-large transition-all relative">
              <div className="absolute -top-6 left-6 w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-2xl font-bold">
                {step.number}
              </div>
              <CardHeader className="pt-8">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <step.icon className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
