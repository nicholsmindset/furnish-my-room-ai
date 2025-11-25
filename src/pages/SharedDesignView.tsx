import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye, Calendar, ArrowLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SharedDesignData {
  id: string;
  share_token: string;
  views_count: number;
  created_at: string;
  expires_at: string | null;
  design_generations: {
    id: string;
    original_image_url: string;
    generated_image_url: string;
    style: string;
    room_type: string;
    created_at: string;
  };
}

export default function SharedDesignView() {
  const { token } = useParams<{ token: string }>();
  const [design, setDesign] = useState<SharedDesignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      fetchSharedDesign(token);
    }
  }, [token]);

  const fetchSharedDesign = async (shareToken: string) => {
    try {
      // Fetch the shared design with related design_generations data
      const { data, error: fetchError } = await supabase
        .from("shared_designs")
        .select(`
          id,
          share_token,
          views_count,
          created_at,
          expires_at,
          design_generations (
            id,
            original_image_url,
            generated_image_url,
            style,
            room_type,
            created_at
          )
        `)
        .eq("share_token", shareToken)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          setError("This shared design was not found or has been removed.");
        } else {
          throw fetchError;
        }
        return;
      }

      // Check if design has expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError("This shared link has expired.");
        return;
      }

      setDesign(data as SharedDesignData);

      // Increment view count
      await supabase
        .from("shared_designs")
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq("id", data.id);

    } catch (err) {
      console.error("Error fetching shared design:", err);
      setError("Failed to load the shared design. Please try again.");
    } finally {
      setLoading(false);
    }
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
      toast({
        title: "Download started",
        description: "Your image is being downloaded.",
      });
    } catch (err) {
      console.error("Error downloading:", err);
      toast({
        title: "Download failed",
        description: "Failed to download the image. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shared design...</p>
        </div>
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Design Not Available</h1>
          <p className="text-muted-foreground mb-6">
            {error || "This shared design could not be found."}
          </p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const gen = design.design_generations;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold">RoomReimagine</span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {design.views_count} views
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(design.created_at), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Shared Room Design</h1>
          <p className="text-muted-foreground">
            <span className="capitalize">{gen.style}</span> style transformation for a{" "}
            <span className="capitalize">{gen.room_type.replace("-", " ")}</span>
          </p>
        </div>

        {/* Before/After Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Original Image */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b bg-muted/50">
              <h3 className="font-semibold text-center">Original Room</h3>
            </div>
            <div className="aspect-video relative overflow-hidden bg-muted">
              <img
                src={gen.original_image_url}
                alt="Original room"
                className="w-full h-full object-contain"
              />
            </div>
          </Card>

          {/* Generated Image */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b bg-primary/10">
              <h3 className="font-semibold text-center text-primary">AI Generated Design</h3>
            </div>
            <div className="aspect-video relative overflow-hidden bg-muted">
              <img
                src={gen.generated_image_url}
                alt="AI generated design"
                className="w-full h-full object-contain"
              />
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => handleDownload(gen.generated_image_url, `roomreimagine-${gen.style}-${gen.id}.png`)}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Design
          </Button>
          <Link to="/">
            <Button size="lg" variant="outline">
              Create Your Own Design
            </Button>
          </Link>
        </div>

        {/* Design Details */}
        <Card className="mt-12 p-6">
          <h3 className="font-semibold mb-4">Design Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Style</p>
              <p className="font-medium capitalize">{gen.style}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Room Type</p>
              <p className="font-medium capitalize">{gen.room_type.replace("-", " ")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{format(new Date(gen.created_at), "MMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Views</p>
              <p className="font-medium">{design.views_count}</p>
            </div>
          </div>
        </Card>

        {/* CTA Section */}
        <div className="mt-12 text-center py-12 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl">
          <h2 className="text-2xl font-bold mb-3">Transform Your Own Space</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Upload a photo of your room and see it transformed with AI-powered interior design
          </p>
          <Link to="/">
            <Button size="lg">
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
          <p>Powered by <Link to="/" className="text-primary hover:underline">RoomReimagine</Link> - AI Interior Design</p>
        </div>
      </div>
    </div>
  );
}
