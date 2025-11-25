import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  X,
  Download,
  Heart,
  Calendar,
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  Check,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { format } from "date-fns";

interface DesignGeneration {
  id: string;
  original_image_url: string;
  generated_image_url: string;
  style: string;
  room_type: string;
  created_at: string;
}

type CompareLayout = "2" | "3" | "4";

export default function Compare() {
  const [generations, setGenerations] = useState<DesignGeneration[]>([]);
  const [selectedDesigns, setSelectedDesigns] = useState<DesignGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [layout, setLayout] = useState<CompareLayout>("2");
  const [zoom, setZoom] = useState(100);
  const [showOriginals, setShowOriginals] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadGenerations();
  }, [user, navigate]);

  const loadGenerations = async () => {
    try {
      const { data, error } = await supabase
        .from("design_generations")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setGenerations(data || []);
    } catch (error) {
      console.error("Error loading generations:", error);
      toast({
        title: "Error",
        description: "Failed to load your designs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDesignSelection = (design: DesignGeneration) => {
    const isSelected = selectedDesigns.some((d) => d.id === design.id);
    if (isSelected) {
      setSelectedDesigns(selectedDesigns.filter((d) => d.id !== design.id));
    } else {
      const maxItems = parseInt(layout);
      if (selectedDesigns.length < maxItems) {
        setSelectedDesigns([...selectedDesigns, design]);
      } else {
        toast({
          title: "Selection limit reached",
          description: `You can compare up to ${maxItems} designs. Change the layout to compare more.`,
        });
      }
    }
  };

  const removeFromComparison = (designId: string) => {
    setSelectedDesigns(selectedDesigns.filter((d) => d.id !== designId));
  };

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading:", error);
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  const addToFavorites = async (generationId: string) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .insert({ generation_id: generationId, user_id: user?.id });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already in favorites",
            description: "This design is already in your favorites.",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Added to favorites",
        description: "Design saved to your favorites.",
      });
    } catch (error) {
      console.error("Error adding to favorites:", error);
      toast({
        title: "Error",
        description: "Failed to add to favorites",
        variant: "destructive",
      });
    }
  };

  const getGridCols = () => {
    switch (layout) {
      case "2":
        return "grid-cols-1 md:grid-cols-2";
      case "3":
        return "grid-cols-1 md:grid-cols-3";
      case "4":
        return "grid-cols-2 md:grid-cols-4";
      default:
        return "grid-cols-2";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Compare Designs</h1>
            <p className="text-muted-foreground mt-1">
              Select designs to compare them side by side
            </p>
          </div>

          {/* Layout Selector */}
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <Button
              variant={layout === "2" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setLayout("2")}
              className="gap-2"
            >
              <Grid2X2 className="w-4 h-4" />
              2
            </Button>
            <Button
              variant={layout === "3" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setLayout("3")}
              className="gap-2"
            >
              <Grid3X3 className="w-4 h-4" />
              3
            </Button>
            <Button
              variant={layout === "4" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setLayout("4")}
              className="gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              4
            </Button>
          </div>
        </div>

        {/* Comparison View */}
        {selectedDesigns.length > 0 && (
          <div className="mb-8">
            {/* Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button
                  variant={showOriginals ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowOriginals(!showOriginals)}
                >
                  {showOriginals ? "Show Generated" : "Show Originals"}
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setZoom(Math.max(50, zoom - 25))}
                    disabled={zoom <= 50}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground w-12 text-center">
                    {zoom}%
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedDesigns([])}>
                Clear All
              </Button>
            </div>

            {/* Comparison Grid */}
            <div className={`grid ${getGridCols()} gap-4`}>
              {selectedDesigns.map((design) => (
                <Card key={design.id} className="overflow-hidden">
                  <div className="relative">
                    <div
                      className="aspect-video overflow-hidden bg-muted"
                      style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: "center",
                      }}
                    >
                      <img
                        src={showOriginals ? design.original_image_url : design.generated_image_url}
                        alt="Design"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removeFromComparison(design.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="capitalize">
                        {design.style}
                      </Badge>
                      <span className="text-xs text-muted-foreground capitalize">
                        {design.room_type.replace("-", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(design.created_at), "MMM d, yyyy")}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          handleDownload(design.generated_image_url, `design-${design.id}.png`)
                        }
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addToFavorites(design.id)}
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Empty Slots */}
              {Array.from({ length: parseInt(layout) - selectedDesigns.length }).map((_, i) => (
                <Card
                  key={`empty-${i}`}
                  className="aspect-video flex items-center justify-center border-dashed cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
                  onClick={() => setIsSelecting(true)}
                >
                  <div className="text-center text-muted-foreground">
                    <Plus className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Add design to compare</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Selection Panel */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Designs</h2>
            <p className="text-sm text-muted-foreground">
              {selectedDesigns.length} of {layout} selected
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : generations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No designs yet</p>
              <Button onClick={() => navigate("/?upload=true")}>Create Your First Design</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {generations.map((gen) => {
                const isSelected = selectedDesigns.some((d) => d.id === gen.id);
                return (
                  <Card
                    key={gen.id}
                    className={`relative aspect-square overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-accent ${
                      isSelected ? "ring-2 ring-accent" : ""
                    }`}
                    onClick={() => toggleDesignSelection(gen)}
                  >
                    <img
                      src={gen.generated_image_url}
                      alt="Design"
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                          <Check className="w-5 h-5 text-accent-foreground" />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-xs text-white capitalize truncate">{gen.style}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
