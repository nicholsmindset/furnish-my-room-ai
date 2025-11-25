import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Loader2, Download, Home, Armchair, Minimize2, TreePine, Wrench, Bed, Utensils, UtensilsCrossed, Bath, Briefcase, Trees, Pause, Play, Package, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type DesignStyle = "modern" | "traditional" | "minimalist" | "scandinavian" | "industrial";
type RoomType = "living-room" | "bedroom" | "kitchen" | "dining-room" | "bathroom" | "office" | "outdoor";

interface BatchImage {
  file: File;
  preview: string;
  status: "pending" | "processing" | "complete" | "error";
  result?: string;
  processingTime?: number;
}

const styleOptions: Array<{ id: DesignStyle; name: string; icon: React.ReactNode }> = [
  { id: "modern", name: "Modern", icon: <Home className="w-4 h-4" /> },
  { id: "traditional", name: "Traditional", icon: <Armchair className="w-4 h-4" /> },
  { id: "minimalist", name: "Minimalist", icon: <Minimize2 className="w-4 h-4" /> },
  { id: "scandinavian", name: "Scandinavian", icon: <TreePine className="w-4 h-4" /> },
  { id: "industrial", name: "Industrial", icon: <Wrench className="w-4 h-4" /> },
];

const roomTypeOptions: Array<{ id: RoomType; name: string; icon: React.ReactNode }> = [
  { id: "living-room", name: "Living Room", icon: <Home className="w-4 h-4" /> },
  { id: "bedroom", name: "Bedroom", icon: <Bed className="w-4 h-4" /> },
  { id: "kitchen", name: "Kitchen", icon: <Utensils className="w-4 h-4" /> },
  { id: "dining-room", name: "Dining Room", icon: <UtensilsCrossed className="w-4 h-4" /> },
  { id: "bathroom", name: "Bathroom", icon: <Bath className="w-4 h-4" /> },
  { id: "office", name: "Home Office", icon: <Briefcase className="w-4 h-4" /> },
  { id: "outdoor", name: "Outdoor Space", icon: <Trees className="w-4 h-4" /> },
];

export default function BatchProcessing() {
  const [images, setImages] = useState<BatchImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [avgProcessingTime, setAvgProcessingTime] = useState<number>(0);
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle>("modern");
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType>("living-room");
  const pauseRef = useRef(false);
  const { user, credits, refreshCredits } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Calculate progress stats
  const completedCount = images.filter((img) => img.status === "complete").length;
  const errorCount = images.filter((img) => img.status === "error").length;
  const pendingCount = images.filter((img) => img.status === "pending").length;
  const totalToProcess = images.length;
  const progressPercent = totalToProcess > 0 ? ((completedCount + errorCount) / totalToProcess) * 100 : 0;

  // Calculate ETA
  const calculateETA = (): string => {
    if (!processing || avgProcessingTime === 0 || pendingCount === 0) return "";
    const remainingImages = pendingCount + (images[currentIndex]?.status === "processing" ? 1 : 0);
    const remainingSeconds = Math.ceil((remainingImages * avgProcessingTime) / 1000);
    if (remainingSeconds < 60) return `${remainingSeconds}s`;
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: "pending" as const,
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Pause/Resume handlers
  const handlePause = () => {
    pauseRef.current = true;
    setIsPaused(true);
  };

  const handleResume = () => {
    pauseRef.current = false;
    setIsPaused(false);
    // Resume processing from current index
    processFromIndex(currentIndex);
  };

  const processFromIndex = async (startIdx: number) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to process images",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const pendingImages = images.filter((img) => img.status === "pending").length;
    if (pendingImages > credits.credits_remaining) {
      toast({
        title: "Insufficient credits",
        description: `You need ${pendingImages} credits but only have ${credits.credits_remaining}`,
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    setIsPaused(false);
    pauseRef.current = false;
    if (!startTime) setStartTime(Date.now());

    const processingTimes: number[] = [];

    for (let i = startIdx; i < images.length; i++) {
      // Check if paused
      if (pauseRef.current) {
        setCurrentIndex(i);
        return;
      }

      // Skip already processed images
      if (images[i].status === "complete" || images[i].status === "error") {
        continue;
      }

      setCurrentIndex(i);
      const imageStartTime = Date.now();

      setImages((prev) =>
        prev.map((img, idx) =>
          idx === i ? { ...img, status: "processing" } : img
        )
      );

      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(images[i].file);
        });

        const base64Image = await base64Promise;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-design`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              imageUrl: base64Image,
              style: selectedStyle,
              roomType: selectedRoomType,
            }),
          }
        );

        if (!response.ok) throw new Error("Generation failed");

        const data = await response.json();
        const processingTime = Date.now() - imageStartTime;
        processingTimes.push(processingTime);

        // Update average processing time
        const newAvg = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
        setAvgProcessingTime(newAvg);

        setImages((prev) =>
          prev.map((img, idx) =>
            idx === i
              ? { ...img, status: "complete", result: data.imageUrl, processingTime }
              : img
          )
        );

        // Save to history
        await supabase.from("design_generations").insert({
          original_image_url: base64Image,
          generated_image_url: data.imageUrl,
          style: selectedStyle,
          room_type: selectedRoomType,
          user_id: user.id,
        });
      } catch (error) {
        console.error("Error processing image:", error);
        setImages((prev) =>
          prev.map((img, idx) =>
            idx === i ? { ...img, status: "error" } : img
          )
        );
      }
    }

    setProcessing(false);
    setStartTime(null);
    refreshCredits();

    const finalCompleted = images.filter((img) => img.status === "complete").length + 1; // +1 for the last one just completed
    toast({
      title: "Batch processing complete!",
      description: `Successfully processed ${finalCompleted} images`,
    });
  };

  const processAll = () => {
    processFromIndex(0);
  };

  const downloadAll = () => {
    images
      .filter((img) => img.status === "complete" && img.result)
      .forEach((img, idx) => {
        setTimeout(() => {
          const link = document.createElement("a");
          link.href = img.result!;
          link.download = `roomreimagine-${selectedStyle}-${selectedRoomType}-${idx + 1}.png`;
          link.click();
        }, idx * 200);
      });
  };

  const downloadAsZip = async () => {
    const completedImages = images.filter((img) => img.status === "complete" && img.result);
    if (completedImages.length === 0) return;

    toast({
      title: "Creating ZIP file...",
      description: "Please wait while we prepare your download",
    });

    try {
      // Dynamically import JSZip
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Fetch and add each image to the zip
      for (let i = 0; i < completedImages.length; i++) {
        const img = completedImages[i];
        try {
          const response = await fetch(img.result!);
          const blob = await response.blob();
          zip.file(`roomreimagine-${selectedStyle}-${selectedRoomType}-${i + 1}.png`, blob);
        } catch (err) {
          console.error(`Failed to add image ${i + 1} to ZIP:`, err);
        }
      }

      // Generate and download the zip
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `roomreimagine-batch-${selectedStyle}-${selectedRoomType}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "ZIP downloaded!",
        description: `Downloaded ${completedImages.length} images`,
      });
    } catch (error) {
      console.error("ZIP creation failed:", error);
      toast({
        title: "ZIP creation failed",
        description: "Falling back to individual downloads",
        variant: "destructive",
      });
      downloadAll();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Batch Processing</h1>
          <p className="text-muted-foreground text-lg">
            Upload multiple images and process them all at once
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Available credits: {credits.credits_remaining}
          </p>
        </div>

        {/* Style and Room Type Selection */}
        {!processing && (
          <Card className="p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="style-select">Design Style</Label>
                <Select value={selectedStyle} onValueChange={(value: DesignStyle) => setSelectedStyle(value)}>
                  <SelectTrigger id="style-select" className="w-full">
                    <SelectValue placeholder="Select a style" />
                  </SelectTrigger>
                  <SelectContent>
                    {styleOptions.map((style) => (
                      <SelectItem key={style.id} value={style.id}>
                        <div className="flex items-center gap-2">
                          {style.icon}
                          <span>{style.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-select">Room Type</Label>
                <Select value={selectedRoomType} onValueChange={(value: RoomType) => setSelectedRoomType(value)}>
                  <SelectTrigger id="room-select" className="w-full">
                    <SelectValue placeholder="Select a room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypeOptions.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        <div className="flex items-center gap-2">
                          {room.icon}
                          <span>{room.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Selected: <span className="font-medium capitalize">{selectedStyle}</span> style for <span className="font-medium capitalize">{selectedRoomType.replace("-", " ")}</span>
            </p>
          </Card>
        )}

        {/* Upload Area */}
        {!processing && (
          <div className="mb-8">
            <label className="block">
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-accent transition-all hover:bg-accent/5 bg-card">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Click or drag images here
                </p>
                <p className="text-sm text-muted-foreground">
                  Select multiple images to process
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </label>
          </div>
        )}

        {/* Progress Bar */}
        {processing && images.length > 0 && (
          <Card className="p-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-accent" />
                  <span className="font-medium">
                    Processing {currentIndex + 1} of {totalToProcess}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {calculateETA() && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>ETA: {calculateETA()}</span>
                    </div>
                  )}
                  {isPaused ? (
                    <Button size="sm" onClick={handleResume} variant="outline">
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handlePause} variant="outline">
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  )}
                </div>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{completedCount} completed</span>
                {errorCount > 0 && <span className="text-destructive">{errorCount} failed</span>}
                <span>{pendingCount} remaining</span>
              </div>
            </div>
          </Card>
        )}

        {/* Paused Banner */}
        {isPaused && (
          <Card className="p-4 mb-8 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Pause className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-800 dark:text-amber-200">
                  Processing paused at image {currentIndex + 1}
                </span>
              </div>
              <Button size="sm" onClick={handleResume}>
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            </div>
          </Card>
        )}

        {/* Image Grid */}
        {images.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {images.map((image, idx) => (
                <Card key={idx} className={`relative overflow-hidden ${idx === currentIndex && processing ? 'ring-2 ring-accent' : ''}`}>
                  <div className="aspect-square relative">
                    <img
                      src={image.result || image.preview}
                      alt={`Upload ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {image.status === "processing" && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                      </div>
                    )}
                    {image.status === "complete" && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      </div>
                    )}
                    {image.status === "error" && (
                      <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center">
                        <span className="text-destructive font-medium">
                          Error
                        </span>
                      </div>
                    )}
                    {!processing && !isPaused && image.status === "pending" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {/* Image number badge */}
                  <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-medium">
                    #{idx + 1}
                  </div>
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              {!processing && !isPaused && images.some((img) => img.status === "pending") && (
                <Button size="lg" onClick={processAll}>
                  <Play className="w-5 h-5 mr-2" />
                  Process All ({images.filter((img) => img.status === "pending").length})
                </Button>
              )}
              {images.some((img) => img.status === "complete") && !processing && (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={downloadAsZip}
                  >
                    <Package className="w-5 h-5 mr-2" />
                    Download ZIP
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={downloadAll}
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Separately
                  </Button>
                </>
              )}
            </div>

            {/* Summary Stats */}
            {!processing && completedCount > 0 && (
              <div className="mt-8 text-center">
                <p className="text-muted-foreground">
                  <span className="text-green-600 font-medium">{completedCount}</span> completed
                  {errorCount > 0 && (
                    <>, <span className="text-destructive font-medium">{errorCount}</span> failed</>
                  )}
                  {pendingCount > 0 && (
                    <>, <span className="font-medium">{pendingCount}</span> pending</>
                  )}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
