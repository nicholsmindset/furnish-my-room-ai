import { useState } from "react";
import Hero from "@/components/Hero";
import UploadSection from "@/components/UploadSection";
import StyleSelector, { DesignStyle } from "@/components/StyleSelector";
import LoadingState from "@/components/LoadingState";
import ResultsDisplay from "@/components/ResultsDisplay";
import { useToast } from "@/hooks/use-toast";

type AppState = "hero" | "upload" | "style-select" | "generating" | "results";

export default function Index() {
  const [appState, setAppState] = useState<AppState>("hero");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleGetStarted = () => {
    setAppState("upload");
    setTimeout(() => {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    }, 100);
  };

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    setOriginalImageUrl(URL.createObjectURL(file));
    setAppState("style-select");
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setOriginalImageUrl("");
    setAppState("upload");
  };

  const handleStyleSelect = async (style: DesignStyle) => {
    if (!selectedImage) return;

    setAppState("generating");
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 500);

    try {
      // Convert image to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
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
          body: JSON.stringify({ imageUrl: base64Image, style }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate design");
      }

      const data = await response.json();
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setGeneratedImageUrl(data.imageUrl);
      
      setTimeout(() => {
        setAppState("results");
        toast({
          title: "Design Complete! 🎉",
          description: "Your room has been beautifully transformed.",
        });
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error generating design:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate design. Please try again.",
      });
      setAppState("style-select");
      setProgress(0);
    }
  };

  const handleBack = () => {
    setSelectedImage(null);
    setOriginalImageUrl("");
    setGeneratedImageUrl("");
    setProgress(0);
    setAppState("hero");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {appState === "hero" && <Hero onGetStarted={handleGetStarted} />}

      {(appState === "upload" || appState === "style-select") && (
        <>
          <UploadSection
            onImageSelect={handleImageSelect}
            selectedImage={selectedImage}
            onClearImage={handleClearImage}
          />
          {appState === "style-select" && (
            <StyleSelector onStyleSelect={handleStyleSelect} />
          )}
        </>
      )}

      {appState === "generating" && <LoadingState progress={progress} />}

      {appState === "results" && (
        <ResultsDisplay
          originalImage={originalImageUrl}
          generatedImage={generatedImageUrl}
          onBack={handleBack}
        />
      )}

      {/* Footer */}
      <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border mt-16">
        <p>&copy; {new Date().getFullYear()} RoomReimagine. All rights reserved.</p>
      </footer>
    </div>
  );
}
