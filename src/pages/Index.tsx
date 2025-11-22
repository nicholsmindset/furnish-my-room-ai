import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import UploadSection from "@/components/UploadSection";
import RoomTypeSelector, { RoomType } from "@/components/RoomTypeSelector";
import StyleSelector, { DesignStyle } from "@/components/StyleSelector";
import LoadingState from "@/components/LoadingState";
import ResultsDisplay from "@/components/ResultsDisplay";
import ImageHistory from "@/components/ImageHistory";
import { CustomStyleParams } from "@/components/CustomStyleControls";

type AppState = "hero" | "upload" | "room-type-select" | "style-select" | "generating" | "results" | "history";

export default function Index() {
  const [appState, setAppState] = useState<AppState>("hero");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>("");
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [customParams, setCustomParams] = useState<CustomStyleParams>({
    colorScheme: "neutral",
    furnitureStyle: "contemporary",
    lighting: 70,
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const handleGetStarted = () => {
    setAppState("upload");
    setTimeout(() => {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    }, 100);
  };

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    setOriginalImageUrl(URL.createObjectURL(file));
    setAppState("room-type-select");
  };

  const handleRoomTypeSelect = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
    setAppState("style-select");
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setOriginalImageUrl("");
    setAppState("upload");
  };

  const handleStyleSelect = async (style: DesignStyle) => {
    if (!selectedImage || !selectedRoomType) return;

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

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-design`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ 
            imageUrl: base64Image, 
            style,
            roomType: selectedRoomType 
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          throw new Error("Insufficient credits. Please upgrade your plan.");
        }
        throw new Error(errorData.error || "Failed to generate design");
      }

      const data = await response.json();
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setGeneratedImageUrl(data.imageUrl);

      // Save to history
      try {
        const { data: genData, error: genError } = await supabase
          .from("design_generations")
          .insert({
            original_image_url: base64Image,
            generated_image_url: data.imageUrl,
            style: style,
            room_type: selectedRoomType,
            user_id: user?.id || null,
          })
          .select()
          .single();

        if (!genError && genData) {
          setGenerationId(genData.id);
        }
      } catch (historyError) {
        console.error("Error saving to history:", historyError);
        // Don't fail the whole operation if history save fails
      }
      
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
    setGenerationId(null);
    setProgress(0);
    setSelectedRoomType(null);
    setAppState("hero");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewHistory = () => {
    setAppState("history");
  };

  const handleSelectFromHistory = (original: string, generated: string) => {
    setOriginalImageUrl(original);
    setGeneratedImageUrl(generated);
    setAppState("results");
  };

  return (
    <div className="min-h-screen bg-background">
      {appState !== "hero" && <Navbar />}
      
      {appState === "hero" && (
        <Hero onGetStarted={handleGetStarted} onViewHistory={handleViewHistory} />
      )}

      {appState === "upload" && (
        <UploadSection
          onImageSelect={handleImageSelect}
          selectedImage={selectedImage}
          onClearImage={handleClearImage}
        />
      )}

      {appState === "room-type-select" && (
        <RoomTypeSelector onRoomTypeSelect={handleRoomTypeSelect} />
      )}

      {appState === "style-select" && (
        <StyleSelector 
          onStyleSelect={handleStyleSelect}
          customParams={customParams}
          onCustomParamsChange={setCustomParams}
        />
      )}

      {appState === "generating" && <LoadingState progress={progress} />}

      {appState === "results" && (
        <ResultsDisplay
          originalImage={originalImageUrl}
          generatedImage={generatedImageUrl}
          generationId={generationId}
          onBack={handleBack}
        />
      )}

      {appState === "history" && (
        <ImageHistory
          onBack={() => setAppState("hero")}
          onSelectGeneration={handleSelectFromHistory}
        />
      )}

      {/* Footer */}
      <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border mt-16">
        <p>&copy; {new Date().getFullYear()} RoomReimagine. All rights reserved.</p>
      </footer>
    </div>
  );
}
