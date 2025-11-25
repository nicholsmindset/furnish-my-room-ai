import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, User, LogOut, Heart, History, Coins, Shield, Settings, Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut, subscription, credits } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleMobileNavigate = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Sparkles className="w-6 h-6 text-accent" />
          <span className="text-xl font-bold">Noonah Design</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/pricing" className="text-sm font-medium hover:text-accent transition-colors">
            Pricing
          </Link>
          <Link to="/gallery" className="text-sm font-medium hover:text-accent transition-colors">
            Gallery
          </Link>
          <Link to="/batch" className="text-sm font-medium hover:text-accent transition-colors">
            Batch
          </Link>

          {user && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full border border-accent/20">
              <Coins className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">{credits.credits_remaining}</span>
              <span className="text-xs text-muted-foreground">credits</span>
            </div>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.email}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {subscription.subscribed ? subscription.tier : "Free"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {credits.credits_remaining} credits
                      </span>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <User className="w-4 h-4 mr-2" />
                  My Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/favorites")}>
                  <Heart className="w-4 h-4 mr-2" />
                  Favorites
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/")}>
                  <History className="w-4 h-4 mr-2" />
                  History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/pricing")}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  View Plans
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
              <Button onClick={() => navigate("/auth")}>Get Started</Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-3">
          {user && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-accent/10 rounded-full border border-accent/20">
              <Coins className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-medium">{credits.credits_remaining}</span>
            </div>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  Noonah Design
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-1">
                {/* User info */}
                {user && (
                  <div className="px-3 py-3 mb-2 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {subscription.subscribed ? subscription.tier : "Free"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {credits.credits_remaining} credits
                      </span>
                    </div>
                  </div>
                )}

                {/* Main navigation */}
                <button
                  onClick={() => handleMobileNavigate("/")}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <Sparkles className="w-5 h-5 text-muted-foreground" />
                  Home
                </button>
                <button
                  onClick={() => handleMobileNavigate("/pricing")}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <Coins className="w-5 h-5 text-muted-foreground" />
                  Pricing
                </button>
                <button
                  onClick={() => handleMobileNavigate("/gallery")}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <History className="w-5 h-5 text-muted-foreground" />
                  Gallery
                </button>
                <button
                  onClick={() => handleMobileNavigate("/batch")}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <History className="w-5 h-5 text-muted-foreground" />
                  Batch Processing
                </button>

                {user && (
                  <>
                    <div className="h-px bg-border my-2" />
                    <button
                      onClick={() => handleMobileNavigate("/dashboard")}
                      className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <User className="w-5 h-5 text-muted-foreground" />
                      My Dashboard
                    </button>
                    <button
                      onClick={() => handleMobileNavigate("/favorites")}
                      className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <Heart className="w-5 h-5 text-muted-foreground" />
                      Favorites
                    </button>
                    <button
                      onClick={() => handleMobileNavigate("/settings")}
                      className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <Settings className="w-5 h-5 text-muted-foreground" />
                      Settings
                    </button>

                    {isAdmin && (
                      <>
                        <div className="h-px bg-border my-2" />
                        <button
                          onClick={() => handleMobileNavigate("/admin")}
                          className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <Shield className="w-5 h-5 text-muted-foreground" />
                          Admin Dashboard
                        </button>
                      </>
                    )}

                    <div className="h-px bg-border my-2" />
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </>
                )}

                {!user && (
                  <>
                    <div className="h-px bg-border my-2" />
                    <button
                      onClick={() => handleMobileNavigate("/auth")}
                      className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <User className="w-5 h-5 text-muted-foreground" />
                      Sign In
                    </button>
                    <Button
                      onClick={() => handleMobileNavigate("/auth")}
                      className="mt-2 w-full"
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
