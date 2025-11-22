import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";

interface ResultsDisplayProps {
  originalImage: string;
  generatedImage: string;
  onBack: () => void;
}

export default function ResultsDisplay({
  originalImage,
  generatedImage,
  onBack,
}: ResultsDisplayProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `roomreimagine-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">Your Transformed Space</h2>
        <p className="text-muted-foreground text-lg">
          Compare the before and after results
        </p>
      </div>

      {/* Before/After Slider */}
      <div
        className="relative w-full aspect-video rounded-xl overflow-hidden shadow-large mb-8 select-none border border-border bg-card"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* After Image (Generated) */}
        <img
          src={generatedImage}
          alt="After - Transformed room"
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* Before Image (Original) with Clip Path */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={originalImage}
            alt="Before - Original room"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Slider Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-accent cursor-ew-resize"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-accent rounded-full border-4 border-background shadow-large" />
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
          Before
        </div>
        <div className="absolute top-4 right-4 bg-accent/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
          After
        </div>
      </div>

      {/* Side by Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <p className="text-sm font-medium mb-2 text-muted-foreground">Before</p>
          <div className="rounded-lg overflow-hidden shadow-medium border border-border bg-card">
            <img
              src={originalImage}
              alt="Original room"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2 text-muted-foreground">After</p>
          <div className="rounded-lg overflow-hidden shadow-medium border border-border bg-card">
            <img
              src={generatedImage}
              alt="Transformed room"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          className="px-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Start Over
        </Button>
        <Button
          size="lg"
          onClick={handleDownload}
          className="bg-accent hover:bg-accent/90 text-accent-foreground px-8"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Result
        </Button>
      </div>
    </div>
  );
}
