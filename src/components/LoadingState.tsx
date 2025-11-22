import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";

interface LoadingStateProps {
  progress?: number;
}

export default function LoadingState({ progress = 0 }: LoadingStateProps) {
  const tasks = [
    { label: "Analyzing room structure", complete: progress > 25 },
    { label: "Selecting furniture pieces", complete: progress > 50 },
    { label: "Applying design style", complete: progress > 75 },
    { label: "Finalizing your space", complete: progress > 90 },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] px-6">
      <div className="relative mb-8">
        <Loader2 className="w-16 h-16 text-accent animate-spin" />
        <Sparkles className="w-8 h-8 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>

      <h2 className="text-3xl font-bold mb-3 text-center">Transforming Your Space</h2>
      <p className="text-muted-foreground text-lg mb-8 text-center max-w-md">
        AI is creating your dream room design
      </p>

      {progress > 0 && (
        <div className="w-full max-w-md mb-8">
          <div className="bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="bg-accent h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">{progress}% complete</p>
        </div>
      )}

      <div className="space-y-3 w-full max-w-md">
        {tasks.map((task, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              task.complete ? "bg-accent/10" : "bg-muted"
            }`}
          >
            {task.complete ? (
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
            )}
            <span
              className={`text-sm ${
                task.complete ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
            >
              {task.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
