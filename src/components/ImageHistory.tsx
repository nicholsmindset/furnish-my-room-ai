import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface HistoryItem {
  id: string;
  original_image_url: string;
  generated_image_url: string;
  style: string;
  room_type: string;
  created_at: string;
}

interface ImageHistoryProps {
  onBack: () => void;
  onSelectGeneration: (original: string, generated: string) => void;
}

export default function ImageHistory({ onBack, onSelectGeneration }: ImageHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("design_generations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error loading history:", error);
      toast({
        title: "Error",
        description: "Failed to load history",
        variant: "destructive",
      });
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
    <div className="min-h-screen p-8 bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Generation History</h1>
          <div className="w-24" /> {/* Spacer for alignment */}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No generations yet. Start creating your first design!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div
                  className="cursor-pointer"
                  onClick={() => onSelectGeneration(item.original_image_url, item.generated_image_url)}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={item.generated_image_url}
                      alt="Generated design"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{item.style} Style</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {item.room_type.replace("-", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(
                        item.generated_image_url,
                        `roomreimagine-${item.style}-${item.room_type}-${item.id}.png`
                      );
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
