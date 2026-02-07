import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Heart, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";

interface FavoriteItem {
  id: string;
  created_at: string;
  design_generations: {
    id: string;
    original_image_url: string;
    generated_image_url: string;
    style: string;
    room_type: string;
    created_at: string;
  };
}

export default function Favorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadFavorites();
  }, [user, navigate]);

  const loadFavorites = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          created_at,
          design_generations (
            id,
            original_image_url,
            generated_image_url,
            style,
            room_type,
            created_at
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error("Error loading favorites:", error);
      toast({
        title: "Error",
        description: "Failed to load favorites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) throw error;

      setFavorites(favorites.filter((fav) => fav.id !== favoriteId));
      toast({
        title: "Removed from favorites",
        description: "Design has been removed from your favorites.",
      });
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast({
        title: "Error",
        description: "Failed to remove favorite",
        variant: "destructive",
      });
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
    } catch (error) {
      console.error("Error downloading:", error);
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-8 bg-gradient-to-b from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Favorites</h1>
            <p className="text-muted-foreground">
              Your saved designs, all in one place
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading favorites...
            </div>
          ) : favorites.length === 0 ? (
            <Card className="p-12 text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
              <p className="text-muted-foreground mb-6">
                Start favoriting designs to see them here
              </p>
              <Button onClick={() => navigate("/")}>Create Your First Design</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((item) => {
                const gen = item.design_generations;
                return (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={gen.generated_image_url}
                        alt={`${gen.style} style ${gen.room_type} design`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {gen.style} Style
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {gen.room_type.replace("-", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(gen.created_at), "MMM d, yyyy")}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            handleDownload(
                              gen.generated_image_url,
                              `favorite-${gen.id}.png`
                            )
                          }
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeFavorite(item.id)}
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
