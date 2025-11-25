import { Upload, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { compressImage, needsCompression, formatFileSize } from "@/lib/imageUtils";

interface UploadSectionProps {
  onImageSelect: (file: File) => void;
  selectedImage: File | null;
  onClearImage: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const COMPRESSION_THRESHOLD_KB = 2048; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export default function UploadSection({
  onImageSelect,
  selectedImage,
  onClearImage,
}: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{ original: number; compressed: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Create and cleanup preview URL when selectedImage changes
  useEffect(() => {
    if (selectedImage) {
      const url = URL.createObjectURL(selectedImage);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [selectedImage]);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Please upload a valid image file (PNG, JPG, or WebP)";
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return `File is too large (${sizeMB}MB). Maximum size is 10MB`;
    }

    return null;
  };

  const handleFileValidation = async (file: File) => {
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: validationError,
      });
      return;
    }

    setError(null);
    setCompressionInfo(null);

    // Check if compression is needed
    if (needsCompression(file, COMPRESSION_THRESHOLD_KB)) {
      setIsCompressing(true);
      try {
        const originalSize = file.size;
        const compressedFile = await compressImage(file, {
          maxWidth: 2048,
          maxHeight: 2048,
          quality: 0.85,
          maxSizeKB: COMPRESSION_THRESHOLD_KB,
        });

        setCompressionInfo({
          original: originalSize,
          compressed: compressedFile.size,
        });

        toast({
          title: "Image optimized",
          description: `Compressed from ${formatFileSize(originalSize)} to ${formatFileSize(compressedFile.size)}`,
        });

        onImageSelect(compressedFile);
      } catch (err) {
        console.error("Compression failed:", err);
        // Fall back to original file
        toast({
          title: "Using original image",
          description: "Compression failed, using original file",
        });
        onImageSelect(file);
      } finally {
        setIsCompressing(false);
      }
    } else {
      onImageSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileValidation(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileValidation(file);
    }
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

      {isCompressing ? (
        <div className="border-2 border-dashed border-accent rounded-xl p-16 text-center bg-accent/5">
          <Loader2 className="w-16 h-16 mx-auto mb-4 text-accent animate-spin" />
          <p className="text-lg font-medium mb-2">Optimizing your image...</p>
          <p className="text-sm text-muted-foreground">
            Compressing for faster upload
          </p>
        </div>
      ) : !selectedImage ? (
        <>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all bg-card shadow-soft ${
              error
                ? "border-destructive bg-destructive/5 hover:border-destructive/70"
                : "border-border hover:border-accent hover:bg-accent/5"
            }`}
          >
            <Upload className={`w-16 h-16 mx-auto mb-4 ${error ? "text-destructive" : "text-muted-foreground"}`} />
            <p className="text-lg font-medium mb-2">Drop your image here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
            <p className="text-xs text-muted-foreground mt-2">
              Supports PNG, JPG, WebP (max 10MB, auto-optimized)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </>
      ) : previewUrl ? (
        <div className="relative">
          <div className="rounded-xl overflow-hidden shadow-medium border border-border bg-card">
            <img
              src={previewUrl}
              alt="Selected room"
              className="w-full h-auto max-h-[500px] object-contain"
            />
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onClearImage();
              setError(null);
              setCompressionInfo(null);
            }}
            className="absolute top-4 right-4 shadow-large"
          >
            <X className="w-4 h-4 mr-2" />
            Remove
          </Button>
          <div className="text-center mt-4 space-y-1">
            <p className="text-sm font-medium">{selectedImage?.name}</p>
            <p className="text-xs text-muted-foreground">
              {selectedImage && formatFileSize(selectedImage.size)}
              {compressionInfo && (
                <span className="text-green-600 dark:text-green-400 ml-2">
                  (optimized from {formatFileSize(compressionInfo.original)})
                </span>
              )}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
