import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Home, AlertCircle, Clock, Eye } from "lucide-react";

interface SharedDesignData {
  design: {
    originalImageUrl: string;
    generatedImageUrl: string;
    style: string;
    roomType: string;
    createdAt: string;
  };
  share: {
    createdAt: string;
    expiresAt: string | null;
    viewsCount: number;
  };
}

type ViewState = "loading" | "success" | "not_found" | "expired" | "error";

export default function SharedDesignView() {
  const { token } = useParams<{ token: string }>();
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [data, setData] = useState<SharedDesignData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setViewState("not_found");
      return;
    }

    const fetchSharedDesign = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-shared-design`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ token }),
          }
        );

        if (response.status === 404) {
          setViewState("not_found");
          return;
        }

        if (response.status === 410) {
          setViewState("expired");
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          setErrorMessage(errorData.error || "Failed to load design");
          setViewState("error");
          return;
        }

        const result = await response.json();
        setData(result);
        setViewState("success");
      } catch (err) {
        console.error("Error fetching shared design:", err);
        setErrorMessage("Failed to load shared design. Please try again.");
        setViewState("error");
      }
    };

    fetchSharedDesign();
  }, [token]);

  const handleDownload = async () => {
    if (!data?.design.generatedImageUrl) return;

    try {
      const response = await fetch(data.design.generatedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `design-${data.design.style}-${data.design.roomType}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading image:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (viewState === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600">Loading shared design...</p>
        </div>
      </div>
    );
  }

  if (viewState === "not_found") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Design Not Found</h1>
            <p className="text-slate-600 mb-6">
              This shared design doesn't exist or may have been removed.
            </p>
            <Link to="/">
              <Button>
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewState === "expired") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Link Expired</h1>
            <p className="text-slate-600 mb-6">
              This share link has expired. Ask the owner to create a new one.
            </p>
            <Link to="/">
              <Button>
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewState === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Something Went Wrong</h1>
            <p className="text-slate-600 mb-6">{errorMessage}</p>
            <Link to="/">
              <Button>
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary">
            Furnish My Room AI
          </Link>
          <Link to="/pricing">
            <Button variant="outline">Create Your Own Design</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Shared Design</h1>
          <div className="flex flex-wrap gap-2 items-center text-sm text-slate-600">
            <Badge variant="secondary" className="capitalize">
              {data.design.roomType.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {data.design.style.replace(/_/g, " ")} Style
            </Badge>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {data.share.viewsCount} views
            </span>
            <span>•</span>
            <span>Created {formatDate(data.design.createdAt)}</span>
          </div>
        </div>

        {/* Before/After Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Original Room</h3>
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-100">
                <img
                  src={data.design.originalImageUrl}
                  alt="Original room"
                  className="w-full h-full object-cover"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">AI-Generated Design</h3>
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-100">
                <img
                  src={data.design.generatedImageUrl}
                  alt="AI-generated design"
                  className="w-full h-full object-cover"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button onClick={handleDownload} size="lg">
            <Download className="w-4 h-4 mr-2" />
            Download Design
          </Button>
          <Link to="/">
            <Button variant="outline" size="lg">
              Try It Yourself
            </Button>
          </Link>
        </div>

        {/* Expiration notice */}
        {data.share.expiresAt && (
          <p className="text-center text-sm text-slate-500 mt-6">
            This link expires on {formatDate(data.share.expiresAt)}
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-slate-600">
          <p>
            Powered by{" "}
            <Link to="/" className="text-primary hover:underline">
              Furnish My Room AI
            </Link>{" "}
            - Transform any room with AI-powered interior design
          </p>
        </div>
      </footer>
    </div>
  );
}
