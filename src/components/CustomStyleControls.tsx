import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Palette, Armchair, Sun, Sparkles, LayoutGrid, DollarSign, Flower2, Frame, Layers } from "lucide-react";

export interface CustomStyleParams {
  colorScheme: string;
  furnitureStyle: string;
  lighting: number;
  styleStrength: number;
  furnitureDensity: string;
  budgetTier: string;
  includePlants: boolean;
  includeArtwork: boolean;
  includeRugs: boolean;
  accentColor: string;
}

interface CustomStyleControlsProps {
  params: CustomStyleParams;
  onChange: (params: CustomStyleParams) => void;
}

const accentColors = [
  { value: "auto", label: "Auto", color: "bg-gradient-to-r from-purple-500 to-pink-500" },
  { value: "blue", label: "Blue", color: "bg-blue-500" },
  { value: "green", label: "Green", color: "bg-green-500" },
  { value: "orange", label: "Orange", color: "bg-orange-500" },
  { value: "purple", label: "Purple", color: "bg-purple-500" },
  { value: "pink", label: "Pink", color: "bg-pink-500" },
  { value: "teal", label: "Teal", color: "bg-teal-500" },
  { value: "amber", label: "Amber", color: "bg-amber-500" },
];

export default function CustomStyleControls({ params, onChange }: CustomStyleControlsProps) {
  return (
    <Card className="p-6 bg-card/50 backdrop-blur">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Style Strength */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <Label>Style Strength</Label>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-12">Subtle</span>
              <Slider
                value={[params.styleStrength]}
                onValueChange={(value) => onChange({ ...params, styleStrength: value[0] })}
                min={20}
                max={100}
                step={10}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12 text-right">Bold</span>
            </div>
            <p className="text-xs text-muted-foreground">
              How dramatically to transform your room
            </p>
          </div>

          {/* Color Scheme */}
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

          {/* Furniture Style */}
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

          {/* Natural Lighting */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-accent" />
              <Label>Natural Lighting</Label>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-12">Dim</span>
              <Slider
                value={[params.lighting]}
                onValueChange={(value) => onChange({ ...params, lighting: value[0] })}
                min={0}
                max={100}
                step={10}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12 text-right">Bright</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Furniture Density */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-accent" />
              <Label>Furniture Density</Label>
            </div>
            <Select
              value={params.furnitureDensity}
              onValueChange={(value) => onChange({ ...params, furnitureDensity: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select density" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimal">Minimal - Open Space</SelectItem>
                <SelectItem value="balanced">Balanced - Just Right</SelectItem>
                <SelectItem value="cozy">Cozy - Well Furnished</SelectItem>
                <SelectItem value="maximalist">Maximalist - Fully Decorated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Budget Tier */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-accent" />
              <Label>Budget Tier</Label>
            </div>
            <Select
              value={params.budgetTier}
              onValueChange={(value) => onChange({ ...params, budgetTier: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="budget">Budget Friendly</SelectItem>
                <SelectItem value="mid-range">Mid-Range</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="luxury">Luxury Designer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent" />
              <Label>Accent Color</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onChange({ ...params, accentColor: color.value })}
                  className={`w-8 h-8 rounded-full ${color.color} transition-all ${
                    params.accentColor === color.value
                      ? "ring-2 ring-offset-2 ring-accent ring-offset-background scale-110"
                      : "hover:scale-105"
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Decorative Elements</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flower2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Plants & Greenery</span>
                </div>
                <Switch
                  checked={params.includePlants}
                  onCheckedChange={(checked) => onChange({ ...params, includePlants: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Frame className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Wall Art & Decor</span>
                </div>
                <Switch
                  checked={params.includeArtwork}
                  onCheckedChange={(checked) => onChange({ ...params, includeArtwork: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Rugs & Textiles</span>
                </div>
                <Switch
                  checked={params.includeRugs}
                  onCheckedChange={(checked) => onChange({ ...params, includeRugs: checked })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
