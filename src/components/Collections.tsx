import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Folder,
  FolderPlus,
  MoreVertical,
  Edit2,
  Trash2,
  Heart,
  ChevronRight,
} from "lucide-react";

export interface Collection {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
  favorites_count?: number;
}

interface CollectionsProps {
  selectedCollection: string | null;
  onSelectCollection: (collectionId: string | null) => void;
}

const COLLECTION_COLORS = [
  { name: "Blue", value: "bg-blue-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Teal", value: "bg-teal-500" },
  { name: "Red", value: "bg-red-500" },
  { name: "Amber", value: "bg-amber-500" },
];

export default function Collections({ selectedCollection, onSelectCollection }: CollectionsProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLLECTION_COLORS[0].value);
  const [totalFavorites, setTotalFavorites] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadCollections();
      loadTotalFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadCollections = async () => {
    try {
      // First, get all collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: true });

      if (collectionsError) throw collectionsError;

      // Then get favorite counts for each collection
      const collectionsWithCounts = await Promise.all(
        (collectionsData || []).map(async (collection) => {
          const { count } = await supabase
            .from("favorites")
            .select("*", { count: "exact", head: true })
            .eq("collection_id", collection.id);

          return {
            ...collection,
            favorites_count: count || 0,
          };
        })
      );

      setCollections(collectionsWithCounts);
    } catch (error) {
      console.error("Error loading collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTotalFavorites = async () => {
    try {
      const { count } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id);

      setTotalFavorites(count || 0);
    } catch (error) {
      console.error("Error loading total favorites:", error);
    }
  };

  const createCollection = async () => {
    if (!newName.trim()) return;

    try {
      const { data, error } = await supabase
        .from("collections")
        .insert({
          name: newName.trim(),
          color: newColor,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      setCollections([...collections, { ...data, favorites_count: 0 }]);
      setNewName("");
      setNewColor(COLLECTION_COLORS[0].value);
      setShowCreateDialog(false);
      toast({
        title: "Collection created",
        description: `"${data.name}" has been created.`,
      });
    } catch (error) {
      console.error("Error creating collection:", error);
      toast({
        title: "Error",
        description: "Failed to create collection",
        variant: "destructive",
      });
    }
  };

  const updateCollection = async () => {
    if (!editingCollection || !newName.trim()) return;

    try {
      const { error } = await supabase
        .from("collections")
        .update({
          name: newName.trim(),
          color: newColor,
        })
        .eq("id", editingCollection.id);

      if (error) throw error;

      setCollections(
        collections.map((c) =>
          c.id === editingCollection.id
            ? { ...c, name: newName.trim(), color: newColor }
            : c
        )
      );
      setShowEditDialog(false);
      setEditingCollection(null);
      toast({
        title: "Collection updated",
        description: "Changes have been saved.",
      });
    } catch (error) {
      console.error("Error updating collection:", error);
      toast({
        title: "Error",
        description: "Failed to update collection",
        variant: "destructive",
      });
    }
  };

  const deleteCollection = async (collection: Collection) => {
    try {
      // First, unassign favorites from this collection (set collection_id to null)
      await supabase
        .from("favorites")
        .update({ collection_id: null })
        .eq("collection_id", collection.id);

      // Then delete the collection
      const { error } = await supabase
        .from("collections")
        .delete()
        .eq("id", collection.id);

      if (error) throw error;

      setCollections(collections.filter((c) => c.id !== collection.id));

      // If the deleted collection was selected, go back to "All"
      if (selectedCollection === collection.id) {
        onSelectCollection(null);
      }

      toast({
        title: "Collection deleted",
        description: `"${collection.name}" has been deleted. Favorites have been moved to All.`,
      });
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast({
        title: "Error",
        description: "Failed to delete collection",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (collection: Collection) => {
    setEditingCollection(collection);
    setNewName(collection.name);
    setNewColor(collection.color);
    setShowEditDialog(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Collections</h3>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <FolderPlus className="w-4 h-4" />
              New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Collection</DialogTitle>
              <DialogDescription>
                Organize your favorites into collections.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="My Collection"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLLECTION_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewColor(color.value)}
                      className={`w-8 h-8 rounded-full ${color.value} transition-all ${
                        newColor === color.value
                          ? "ring-2 ring-offset-2 ring-foreground scale-110"
                          : "hover:scale-105"
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createCollection} disabled={!newName.trim()}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {/* All Favorites */}
          <button
            onClick={() => onSelectCollection(null)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              selectedCollection === null
                ? "bg-accent text-accent-foreground"
                : "hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">All Favorites</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {totalFavorites}
            </Badge>
          </button>

          {/* Uncategorized */}
          <button
            onClick={() => onSelectCollection("uncategorized")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              selectedCollection === "uncategorized"
                ? "bg-accent text-accent-foreground"
                : "hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-3">
              <Folder className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Uncategorized</span>
            </div>
          </button>

          {/* User Collections */}
          {collections.map((collection) => (
            <div
              key={collection.id}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors group ${
                selectedCollection === collection.id
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <button
                onClick={() => onSelectCollection(collection.id)}
                className="flex items-center gap-3 flex-1"
              >
                <div className={`w-4 h-4 rounded ${collection.color}`} />
                <span className="text-sm font-medium truncate">{collection.name}</span>
              </button>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {collection.favorites_count}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(collection)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteCollection(collection)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>
              Update your collection's name and color.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="Collection name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLLECTION_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewColor(color.value)}
                    className={`w-8 h-8 rounded-full ${color.value} transition-all ${
                      newColor === color.value
                        ? "ring-2 ring-offset-2 ring-foreground scale-110"
                        : "hover:scale-105"
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateCollection} disabled={!newName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
