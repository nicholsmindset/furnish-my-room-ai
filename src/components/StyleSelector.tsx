import { Home, Armchair, Minimize2, TreePine, Wrench, Settings, Clock, AlertTriangle, RefreshCw, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomStyleControls, { CustomStyleParams } from "./CustomStyleControls";

export type DesignStyle = "modern" | "traditional" | "minimalist" | "scandinavian" | "industrial";

interface StyleSelectorProps {
  onStyleSelect: (style: DesignStyle) => void;
  disabled?: boolean;
  rateLimitSeconds?: number;
  creditsRemaining?: number;
  customParams?: CustomStyleParams;
  onCustomParamsChange?: (params: CustomStyleParams) => void;
  lastError?: string | null;
  onRetry?: () => void;
  canRetry?: boolean;
}

const styles: Array<{
  id: DesignStyle;
  name: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean lines, neutral colors, contemporary furniture",
    icon: <Home className="w-8 h-8" />,
  },
  {
    id: "traditional",
    name: "Traditional",
    description: "Classic furniture, warm colors, elegant details",
    icon: <Armchair className="w-8 h-8" />,
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Simple furniture, neutral palette, uncluttered space",
    icon: <Minimize2 className="w-8 h-8" />,
  },
  {
    id: "scandinavian",
    name: "Scandinavian",
    description: "Light wood, cozy textiles, natural elements",
    icon: <TreePine className="w-8 h-8" />,
  },
  {
    id: "industrial",
    name: "Industrial",
    description: "Exposed elements, metal accents, urban aesthetic",
    icon: <Wrench className="w-8 h-8" />,
  },
];

export default function StyleSelector({ onStyleSelect, disabled, rateLimitSeconds, creditsRemaining, customParams, onCustomParamsChange, lastError, onRetry, canRetry }: StyleSelectorProps) {
  const [showCustomControls, setShowCustomControls] = useState(false);
  const navigate = useNavigate();

  const hasNoCredits = creditsRemaining !== undefined && creditsRemaining <= 0;
  const isRetryableError = lastError && !lastError.includes("Rate limit") && !lastError.includes("Insufficient credits");

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12 space-y-8">
      {/* Rate Limit Banner */}
      {rateLimitSeconds && rateLimitSeconds > 0 && (
        <div className="max-w-md mx-auto bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Rate limit reached
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Please wait <span className="font-mono font-bold">{formatTime(rateLimitSeconds)}</span> before generating again
            </p>
          </div>
        </div>
      )}

      {/* No Credits Banner */}
      {hasNoCredits && !rateLimitSeconds && (
        <div className="max-w-md mx-auto bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                No credits remaining
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Upgrade your plan to continue generating designs
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/pricing")}
            className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white"
          >
            View Plans & Upgrade
          </Button>
        </div>
      )}

      {/* Error Banner with Retry */}
      {isRetryableError && (
        <div className="max-w-md mx-auto bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Generation failed
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-400 line-clamp-2">
                {lastError}
              </p>
            </div>
          </div>
          {canRetry && onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="w-full mt-3 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      )}

      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">Choose Your Design Style</h2>
        <p className="text-muted-foreground text-lg">
          Select a style to transform your space
        </p>
      </div>

      {customParams && onCustomParamsChange && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant={showCustomControls ? "default" : "outline"}
              onClick={() => setShowCustomControls(!showCustomControls)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              {showCustomControls ? "Hide" : "Show"} Custom Options
            </Button>
          </div>
          
          {showCustomControls && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <CustomStyleControls
                params={customParams}
                onChange={onCustomParamsChange}
              />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {styles.map((style) => (
          <Card
            key={style.id}
            onClick={() => !disabled && onStyleSelect(style.id)}
            className={`cursor-pointer transition-all hover:shadow-medium hover:scale-105 ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            } hover:border-accent bg-card`}
          >
            <CardHeader>
              <div className="flex justify-center mb-4 text-accent">
                {style.icon}
              </div>
              <CardTitle className="text-center text-2xl">{style.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-base">
                {style.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
