import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

interface UploadSectionProps {
  onImageSelect: (file: File) => void;
  selectedImage: File | null;
  onClearImage: () => void;
}

export default function UploadSection({
  onImageSelect,
  selectedImage,
  onClearImage,
}: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onImageSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">Upload Your Room Photo</h2>
        <p className="text-muted-foreground text-lg">
          Drag and drop or click to browse your empty room image
        </p>
      </div>

      {!selectedImage ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-16 text-center cursor-pointer hover:border-accent transition-all hover:bg-accent/5 bg-card shadow-soft"
        >
          <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Drop your image here</p>
          <p className="text-sm text-muted-foreground">or click to browse</p>
          <p className="text-xs text-muted-foreground mt-2">Supports PNG, JPG, JPEG</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative">
          <div className="rounded-xl overflow-hidden shadow-medium border border-border bg-card">
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="Selected room"
              className="w-full h-auto max-h-[500px] object-contain"
            />
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={onClearImage}
            className="absolute top-4 right-4 shadow-large"
          >
            <X className="w-4 h-4 mr-2" />
            Remove
          </Button>
          <p className="text-center mt-4 text-sm text-muted-foreground">
            {selectedImage.name}
          </p>
        </div>
      )}
    </div>
  );
}
