import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, Loader2, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";

interface BatchImage {
  file: File;
  preview: string;
  status: "pending" | "processing" | "complete" | "error";
  result?: string;
}

export default function BatchProcessing() {
  const [images, setImages] = useState<BatchImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const { user, credits } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const processAll = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to process images",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (images.length > credits.credits_remaining) {
      toast({
        title: "Insufficient credits",
        description: `You need ${images.length} credits but only have ${credits.credits_remaining}`,
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    for (let i = 0; i < images.length; i++) {
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
              style: "modern",
              roomType: "living-room",
            }),
          }
        );

        if (!response.ok) throw new Error("Generation failed");

        const data = await response.json();

        setImages((prev) =>
          prev.map((img, idx) =>
            idx === i
              ? { ...img, status: "complete", result: data.imageUrl }
              : img
          )
        );

        // Save to history
        await supabase.from("design_generations").insert({
          original_image_url: base64Image,
          generated_image_url: data.imageUrl,
          style: "modern",
          room_type: "living-room",
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
    toast({
      title: "Batch processing complete!",
      description: `Successfully processed ${
        images.filter((img) => img.status === "complete").length
      } images`,
    });
  };

  const downloadAll = () => {
    images
      .filter((img) => img.status === "complete" && img.result)
      .forEach((img, idx) => {
        setTimeout(() => {
          const link = document.createElement("a");
          link.href = img.result!;
          link.download = `roomreimagine-batch-${idx + 1}.png`;
          link.click();
        }, idx * 200);
      });
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

        {/* Image Grid */}
        {images.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {images.map((image, idx) => (
                <Card key={idx} className="relative overflow-hidden">
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
                    {!processing && image.status === "pending" && (
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
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              {!processing && images.some((img) => img.status === "pending") && (
                <Button size="lg" onClick={processAll} disabled={processing}>
                  Process All ({images.filter((img) => img.status === "pending").length})
                </Button>
              )}
              {images.some((img) => img.status === "complete") && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={downloadAll}
                  disabled={processing}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download All
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
