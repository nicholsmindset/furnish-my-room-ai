import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Heart, Calendar, MoreVertical, FolderInput, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Collections, { Collection } from "@/components/Collections";

interface FavoriteItem {
  id: string;
  created_at: string;
  collection_id: string | null;
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
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
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
    loadCollections();
  }, [user, navigate]);

  useEffect(() => {
    // Filter favorites based on selected collection
    if (selectedCollection === null) {
      setFilteredFavorites(favorites);
    } else if (selectedCollection === "uncategorized") {
      setFilteredFavorites(favorites.filter((fav) => !fav.collection_id));
    } else {
      setFilteredFavorites(favorites.filter((fav) => fav.collection_id === selectedCollection));
    }
  }, [favorites, selectedCollection]);

  const loadFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          created_at,
          collection_id,
          design_generations (
            id,
            original_image_url,
            generated_image_url,
            style,
            room_type,
            created_at
          )
        `)
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

  const loadCollections = async () => {
    try {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error("Error loading collections:", error);
    }
  };

  const moveToCollection = async (favoriteId: string, collectionId: string | null) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .update({ collection_id: collectionId })
        .eq("id", favoriteId);

      if (error) throw error;

      setFavorites(
        favorites.map((fav) =>
          fav.id === favoriteId ? { ...fav, collection_id: collectionId } : fav
        )
      );

      const collectionName = collectionId
        ? collections.find((c) => c.id === collectionId)?.name || "collection"
        : "Uncategorized";

      toast({
        title: "Moved to " + collectionName,
        description: "Favorite has been moved.",
      });
    } catch (error) {
      console.error("Error moving favorite:", error);
      toast({
        title: "Error",
        description: "Failed to move favorite",
        variant: "destructive",
      });
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

  const getCollectionTitle = () => {
    if (selectedCollection === null) return "All Favorites";
    if (selectedCollection === "uncategorized") return "Uncategorized";
    return collections.find((c) => c.id === selectedCollection)?.name || "Collection";
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Collections Sidebar */}
            <aside className="w-full md:w-64 shrink-0">
              <Card className="p-4 sticky top-24">
                <Collections
                  selectedCollection={selectedCollection}
                  onSelectCollection={(id) => {
                    setSelectedCollection(id);
                    loadCollections();
                  }}
                />
              </Card>
            </aside>

            {/* Main Content */}
            <main className="flex-1 space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{getCollectionTitle()}</h1>
                <p className="text-muted-foreground">
                  {filteredFavorites.length} {filteredFavorites.length === 1 ? "design" : "designs"}
                </p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <Skeleton className="aspect-video w-full" />
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-3 w-28" />
                        <div className="flex gap-2">
                          <Skeleton className="h-9 flex-1" />
                          <Skeleton className="h-9 w-9" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : filteredFavorites.length === 0 ? (
                <Card className="p-12 text-center">
                  <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">
                    {selectedCollection === null ? "No favorites yet" : "No designs in this collection"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {selectedCollection === null
                      ? "Start favoriting designs to see them here"
                      : "Move some designs to this collection"}
                  </p>
                  {selectedCollection === null && (
                    <Button onClick={() => navigate("/")}>Create Your First Design</Button>
                  )}
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFavorites.map((item) => {
                    const gen = item.design_generations;
                    return (
                      <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={gen.generated_image_url}
                            alt="Favorite design"
                            className="w-full h-full object-cover"
                          />
                          {/* Action menu on hover */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDownload(gen.generated_image_url, `favorite-${gen.id}.png`)
                                  }
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => moveToCollection(item.id, null)}
                                  disabled={!item.collection_id}
                                >
                                  <FolderInput className="w-4 h-4 mr-2" />
                                  Move to Uncategorized
                                </DropdownMenuItem>
                                {collections.map((col) => (
                                  <DropdownMenuItem
                                    key={col.id}
                                    onClick={() => moveToCollection(item.id, col.id)}
                                    disabled={item.collection_id === col.id}
                                  >
                                    <div className={`w-3 h-3 rounded mr-2 ${col.color}`} />
                                    Move to {col.name}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => removeFavorite(item.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove from favorites
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(gen.created_at), "MMM d, yyyy")}
                            </div>
                            {item.collection_id && (
                              <div
                                className={`w-3 h-3 rounded ${
                                  collections.find((c) => c.id === item.collection_id)?.color || "bg-gray-400"
                                }`}
                                title={collections.find((c) => c.id === item.collection_id)?.name}
                              />
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() =>
                                handleDownload(gen.generated_image_url, `favorite-${gen.id}.png`)
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
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
