import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Palette, Armchair, Sun } from "lucide-react";

export interface CustomStyleParams {
  colorScheme: string;
  furnitureStyle: string;
  lighting: number;
}

interface CustomStyleControlsProps {
  params: CustomStyleParams;
  onChange: (params: CustomStyleParams) => void;
}

export default function CustomStyleControls({ params, onChange }: CustomStyleControlsProps) {
  return (
    <Card className="p-6 space-y-6 bg-card/50 backdrop-blur">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-accent" />
          <Label>Color Scheme</Label>
        </div>
        <Select
          value={params.colorScheme}
          onValueChange={(value) => onChange({ ...params, colorScheme: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select color scheme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="neutral">Neutral Tones</SelectItem>
            <SelectItem value="warm">Warm Colors</SelectItem>
            <SelectItem value="cool">Cool Colors</SelectItem>
            <SelectItem value="bold">Bold & Vibrant</SelectItem>
            <SelectItem value="monochrome">Monochrome</SelectItem>
            <SelectItem value="natural">Natural Earth Tones</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Armchair className="w-4 h-4 text-accent" />
          <Label>Furniture Style</Label>
        </div>
        <Select
          value={params.furnitureStyle}
          onValueChange={(value) => onChange({ ...params, furnitureStyle: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select furniture style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contemporary">Contemporary</SelectItem>
            <SelectItem value="vintage">Vintage</SelectItem>
            <SelectItem value="rustic">Rustic</SelectItem>
            <SelectItem value="luxury">Luxury</SelectItem>
            <SelectItem value="minimalist">Minimalist</SelectItem>
            <SelectItem value="eclectic">Eclectic Mix</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-accent" />
          <Label>Natural Lighting</Label>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Dim</span>
          <Slider
            value={[params.lighting]}
            onValueChange={(value) => onChange({ ...params, lighting: value[0] })}
            min={0}
            max={100}
            step={10}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground">Bright</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Adjust the amount of natural light in the generated design
        </p>
      </div>
    </Card>
  );
}
