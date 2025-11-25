import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, FileImage, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  fileName?: string;
}

type ExportFormat = "png" | "jpg" | "webp";
type Resolution = "original" | "1080p" | "4k" | "custom";

const RESOLUTIONS = {
  original: { width: 0, height: 0, label: "Original" },
  "1080p": { width: 1920, height: 1080, label: "1080p (1920×1080)" },
  "4k": { width: 3840, height: 2160, label: "4K (3840×2160)" },
  custom: { width: 0, height: 0, label: "Custom" },
};

export default function ExportDialog({
  open,
  onOpenChange,
  imageUrl,
  fileName = "design",
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [resolution, setResolution] = useState<Resolution>("original");
  const [quality, setQuality] = useState(90);
  const [addWatermark, setAddWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState("Noonah Design");
  const [watermarkPosition, setWatermarkPosition] = useState<"bottom-right" | "bottom-left" | "center">("bottom-right");
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    try {
      // Load the image
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageUrl;
      });

      // Calculate dimensions
      let targetWidth = img.width;
      let targetHeight = img.height;

      if (resolution !== "original") {
        const res = RESOLUTIONS[resolution];
        if (res.width > 0) {
          const aspectRatio = img.width / img.height;
          if (aspectRatio > res.width / res.height) {
            targetWidth = res.width;
            targetHeight = Math.round(res.width / aspectRatio);
          } else {
            targetHeight = res.height;
            targetWidth = Math.round(res.height * aspectRatio);
          }
        }
      }

      // Create canvas
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      // Draw image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Add watermark if enabled
      if (addWatermark && watermarkText) {
        ctx.save();

        // Calculate font size based on image size
        const fontSize = Math.max(12, Math.floor(targetWidth / 40));
        ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

        const textMetrics = ctx.measureText(watermarkText);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;
        const padding = fontSize / 2;

        // Position calculation
        let x: number, y: number;
        switch (watermarkPosition) {
          case "bottom-left":
            x = padding;
            y = targetHeight - padding;
            break;
          case "center":
            x = (targetWidth - textWidth) / 2;
            y = (targetHeight + textHeight) / 2;
            break;
          case "bottom-right":
          default:
            x = targetWidth - textWidth - padding;
            y = targetHeight - padding;
            break;
        }

        // Draw watermark background
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(
          x - padding / 2,
          y - textHeight,
          textWidth + padding,
          textHeight + padding / 2
        );

        // Draw watermark text
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillText(watermarkText, x, y);

        ctx.restore();
      }

      // Convert to desired format
      let mimeType: string;
      let fileExtension: string;

      switch (format) {
        case "jpg":
          mimeType = "image/jpeg";
          fileExtension = "jpg";
          break;
        case "webp":
          mimeType = "image/webp";
          fileExtension = "webp";
          break;
        case "png":
        default:
          mimeType = "image/png";
          fileExtension = "png";
          break;
      }

      // Get blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create blob"));
            }
          },
          mimeType,
          format === "png" ? undefined : quality / 100
        );
      });

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: `Downloaded as ${fileName}.${fileExtension}`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            Export Design
          </DialogTitle>
          <DialogDescription>
            Choose your export settings and download your design.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="png" id="png" />
                <Label htmlFor="png" className="cursor-pointer">PNG</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="jpg" id="jpg" />
                <Label htmlFor="jpg" className="cursor-pointer">JPG</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="webp" id="webp" />
                <Label htmlFor="webp" className="cursor-pointer">WebP</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Resolution Selection */}
          <div className="space-y-2">
            <Label>Resolution</Label>
            <Select value={resolution} onValueChange={(v) => setResolution(v as Resolution)}>
              <SelectTrigger>
                <SelectValue placeholder="Select resolution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Original Size</SelectItem>
                <SelectItem value="1080p">1080p (1920×1080)</SelectItem>
                <SelectItem value="4k">4K (3840×2160)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quality Slider (for JPG and WebP) */}
          {(format === "jpg" || format === "webp") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Quality</Label>
                <span className="text-sm text-muted-foreground">{quality}%</span>
              </div>
              <Slider
                value={[quality]}
                onValueChange={(v) => setQuality(v[0])}
                min={10}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Higher quality means larger file size
              </p>
            </div>
          )}

          {/* Watermark Section */}
          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Add Watermark</Label>
                <p className="text-xs text-muted-foreground">
                  Add your branding to the image
                </p>
              </div>
              <Switch checked={addWatermark} onCheckedChange={setAddWatermark} />
            </div>

            {addWatermark && (
              <>
                <div className="space-y-2">
                  <Label>Watermark Text</Label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Enter watermark text"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    value={watermarkPosition}
                    onValueChange={(v) => setWatermarkPosition(v as typeof watermarkPosition)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
