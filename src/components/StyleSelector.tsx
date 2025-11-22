import { Home, Armchair, Minimize2, TreePine, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type DesignStyle = "modern" | "traditional" | "minimalist" | "scandinavian" | "industrial";

interface StyleSelectorProps {
  onStyleSelect: (style: DesignStyle) => void;
  disabled?: boolean;
}

const styles: Array<{
  id: DesignStyle;
  name: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean lines, neutral colors, contemporary furniture",
    icon: <Home className="w-8 h-8" />,
  },
  {
    id: "traditional",
    name: "Traditional",
    description: "Classic furniture, warm colors, elegant details",
    icon: <Armchair className="w-8 h-8" />,
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Simple furniture, neutral palette, uncluttered space",
    icon: <Minimize2 className="w-8 h-8" />,
  },
  {
    id: "scandinavian",
    name: "Scandinavian",
    description: "Light wood, cozy textiles, natural elements",
    icon: <TreePine className="w-8 h-8" />,
  },
  {
    id: "industrial",
    name: "Industrial",
    description: "Exposed elements, metal accents, urban aesthetic",
    icon: <Wrench className="w-8 h-8" />,
  },
];

export default function StyleSelector({ onStyleSelect, disabled }: StyleSelectorProps) {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">Choose Your Design Style</h2>
        <p className="text-muted-foreground text-lg">
          Select a style to transform your space
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {styles.map((style) => (
          <Card
            key={style.id}
            onClick={() => !disabled && onStyleSelect(style.id)}
            className={`cursor-pointer transition-all hover:shadow-medium hover:scale-105 ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            } hover:border-accent bg-card`}
          >
            <CardHeader>
              <div className="flex justify-center mb-4 text-accent">
                {style.icon}
              </div>
              <CardTitle className="text-center text-2xl">{style.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-base">
                {style.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
