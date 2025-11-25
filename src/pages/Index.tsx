import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProblemSolution from "@/components/ProblemSolution";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import UploadSection from "@/components/UploadSection";
import RoomTypeSelector, { RoomType } from "@/components/RoomTypeSelector";
import StyleSelector, { DesignStyle } from "@/components/StyleSelector";
import LoadingState from "@/components/LoadingState";
import ResultsDisplay from "@/components/ResultsDisplay";
import ImageHistory from "@/components/ImageHistory";
import { CustomStyleParams } from "@/components/CustomStyleControls";
import { Sparkles, Clock } from "lucide-react";

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
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [lastSelectedStyle, setLastSelectedStyle] = useState<DesignStyle | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  const { user, subscription, credits, refreshCredits } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitSeconds <= 0) return;

    const timer = setInterval(() => {
      setRateLimitSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimitSeconds]);

  useEffect(() => {
    if (searchParams.get("upload") === "true" && user && subscription.subscribed) {
      setAppState("upload");
      setTimeout(() => {
        window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
      }, 100);
    }
  }, [searchParams, user, subscription.subscribed]);

  const handleGetStarted = () => {
    if (!user || !subscription.subscribed) {
      navigate("/pricing");
      return;
    }
    setAppState("upload");
    setTimeout(() => {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    }, 100);
  };

  const handleImageSelect = (file: File) => {
    // Clean up previous blob URL if exists
    if (originalImageUrl && originalImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(originalImageUrl);
    }
    setSelectedImage(file);
    setOriginalImageUrl(URL.createObjectURL(file));
    setAppState("room-type-select");
  };

  const handleRoomTypeSelect = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
    setAppState("style-select");
  };

  const handleClearImage = () => {
    // Clean up blob URL
    if (originalImageUrl && originalImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(originalImageUrl);
    }
    setSelectedImage(null);
    setOriginalImageUrl("");
    setAppState("upload");
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (originalImageUrl && originalImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(originalImageUrl);
      }
    };
  }, [originalImageUrl]);

  const handleStyleSelect = async (style: DesignStyle) => {
    if (!selectedImage || !selectedRoomType) return;

    setLastSelectedStyle(style);
    setLastError(null);
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
        if (response.status === 429) {
          // Rate limited - extract retry-after time
          const retryAfter = errorData.retryAfter || 60;
          setRateLimitSeconds(retryAfter);
          throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds.`);
        }
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
        // Refresh credits after successful generation
        refreshCredits();
        // Reset retry state on success
        setRetryCount(0);
        setLastError(null);
        toast({
          title: "Design Complete! 🎉",
          description: "Your room has been beautifully transformed.",
        });
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error generating design:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate design. Please try again.";
      setLastError(errorMessage);

      // Check if it's a retryable error (not rate limit or insufficient credits)
      const isRetryable = !errorMessage.includes("Rate limit") && !errorMessage.includes("Insufficient credits");

      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: errorMessage,
        action: isRetryable && retryCount < 3 ? (
          <button
            onClick={handleRetry}
            className="bg-destructive-foreground text-destructive px-3 py-1 rounded text-sm font-medium hover:opacity-90"
          >
            Retry
          </button>
        ) : undefined,
      });
      setAppState("style-select");
      setProgress(0);
    }
  };

  const handleRetry = () => {
    if (lastSelectedStyle && retryCount < 3) {
      setRetryCount((prev) => prev + 1);
      handleStyleSelect(lastSelectedStyle);
    }
  };

  const handleBack = () => {
    // Clean up blob URL
    if (originalImageUrl && originalImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(originalImageUrl);
    }
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
        <>
          <Hero onViewHistory={handleViewHistory} />
          <ProblemSolution />
          <Features />
          <HowItWorks />
          <Testimonials />
          <FAQ />
          <FinalCTA />
        </>
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
          disabled={rateLimitSeconds > 0 || credits.credits_remaining <= 0}
          rateLimitSeconds={rateLimitSeconds}
          creditsRemaining={credits.credits_remaining}
          lastError={lastError}
          onRetry={handleRetry}
          canRetry={retryCount < 3 && !!lastSelectedStyle}
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
      <footer className="py-8 px-6 text-center text-muted-foreground text-sm border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="font-bold text-foreground">Noonah Design</span>
          </div>
          <div className="flex gap-6">
            <Link to="/pricing" className="hover:text-accent transition-colors">
              Pricing
            </Link>
            <Link to="/gallery" className="hover:text-accent transition-colors">
              Gallery
            </Link>
            <a href="#" className="hover:text-accent transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-accent transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-accent transition-colors">
              Support
            </a>
          </div>
          <p>&copy; {new Date().getFullYear()} Noonah Design. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
