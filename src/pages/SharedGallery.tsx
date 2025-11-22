import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";

interface SharedDesign {
  id: string;
  generation_id: string;
  share_token: string;
  views_count: number;
  created_at: string;
  design: {
    original_image_url: string;
    generated_image_url: string;
    style: string;
    room_type: string;
  };
}

export default function SharedGallery() {
  const [designs, setDesigns] = useState<SharedDesign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSharedDesigns();
  }, []);

  const fetchSharedDesigns = async () => {
    try {
      const { data, error } = await supabase
        .from("shared_designs")
        .select(
          `
          *,
          design:design_generations(*)
        `
        )
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setDesigns(data as any);
    } catch (error) {
      console.error("Error fetching shared designs:", error);
    } finally {
      setLoading(false);
    }
  };

  const openSharedDesign = (shareToken: string) => {
    window.open(`/shared/${shareToken}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Shared Gallery</h1>
          <p className="text-muted-foreground text-lg">
            Explore stunning room transformations from our community
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading designs...</p>
          </div>
        ) : designs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No shared designs yet. Be the first to share!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design) => (
              <Card
                key={design.id}
                className="overflow-hidden hover:shadow-large transition-all cursor-pointer group"
                onClick={() => openSharedDesign(design.share_token)}
              >
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={design.design.generated_image_url}
                    alt="Shared design"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between text-white">
                        <div>
                          <p className="font-medium capitalize">
                            {design.design.style}
                          </p>
                          <p className="text-sm opacity-90 capitalize">
                            {design.design.room_type.replace("-", " ")}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openSharedDesign(design.share_token);
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span>{design.views_count} views</span>
                    <span className="ml-auto text-xs">
                      {new Date(design.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
