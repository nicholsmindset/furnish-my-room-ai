import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowUpRight, CreditCard, Settings, Sparkles, Zap, Crown, AlertTriangle, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PRODUCT_IDS = {
  pro: "prod_RZkgNtbGJ0eY8j",
  business: "prod_RZkhKK9YPWl8YJ",
};

interface UsageLog {
  id: string;
  created_at: string;
  action_type: string;
  credits_cost: number;
  metadata: any;
}

export default function UserDashboard() {
  const { user, session, subscription, credits } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [usageHistory, setUsageHistory] = useState<UsageLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUsageHistory();
    }
  }, [user]);

  const fetchUsageHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setUsageHistory(data || []);
    } catch (error) {
      console.error('Error fetching usage history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleUpgrade = async (tier: 'pro' | 'business') => {
    console.log('handleUpgrade called with tier:', tier);
    console.log('User:', user?.email);
    console.log('Session exists:', !!session);
    
    if (!user || !session) {
      console.error('Missing user or session');
      toast({
        title: "Authentication Required",
        description: "Please log in to upgrade your subscription.",
        variant: "destructive",
      });
      return;
    }

    setLoading(tier);
    console.log('Product ID:', PRODUCT_IDS[tier]);
    
    try {
      console.log('Invoking create-checkout function...');
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { productId: PRODUCT_IDS[tier] },
      });

      console.log('Response data:', data);
      console.log('Response error:', error);

      if (error) throw error;
      
      if (data?.url) {
        console.log('Redirecting to:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user || !session) return;

    setLoading("portal");
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast({
        title: "Error",
        description: "Failed to open customer portal.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'free':
        return Sparkles;
      case 'pro':
        return Zap;
      case 'business':
        return Crown;
      default:
        return Sparkles;
    }
  };

  const PlanIcon = getPlanIcon(subscription.tier);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Manage your account and subscription</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Low Credit Alert */}
          {credits.credits_remaining <= 5 && credits.credits_remaining > 0 && (
            <Alert variant="destructive" className="lg:col-span-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Low Credits Warning</AlertTitle>
              <AlertDescription>
                You have only {credits.credits_remaining} credit{credits.credits_remaining !== 1 ? 's' : ''} remaining. 
                Upgrade your plan to continue generating designs without interruption.
              </AlertDescription>
            </Alert>
          )}

          {credits.credits_remaining === 0 && (
            <Alert variant="destructive" className="lg:col-span-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Out of Credits</AlertTitle>
              <AlertDescription>
                You've used all your available credits. Upgrade to a paid plan to continue creating stunning designs.
              </AlertDescription>
            </Alert>
          )}

          {/* Current Plan Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <PlanIcon className="w-6 h-6 text-accent" />
                    {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan
                  </CardTitle>
                  <CardDescription>
                    {subscription.subscribed
                      ? `Active until ${new Date(subscription.subscription_end!).toLocaleDateString()}`
                      : "Free tier - upgrade to unlock more features"}
                  </CardDescription>
                </div>
                <Badge variant={subscription.subscribed ? "default" : "secondary"}>
                  {subscription.subscribed ? "Active" : "Free"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Credits Display */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Available Credits</p>
                  <p className="text-2xl font-bold">{credits.credits_remaining}</p>
                </div>
                <CreditCard className="w-8 h-8 text-muted-foreground" />
              </div>

              {/* Upgrade/Manage Buttons */}
              <div className="space-y-3">
                {!subscription.subscribed && (
                  <>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => handleUpgrade('pro')}
                      disabled={loading === 'pro'}
                    >
                      <ArrowUpRight className="w-5 h-5 mr-2" />
                      {loading === 'pro' ? 'Loading...' : 'Upgrade to Pro - $29/mo'}
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      size="lg"
                      onClick={() => handleUpgrade('business')}
                      disabled={loading === 'business'}
                    >
                      <ArrowUpRight className="w-5 h-5 mr-2" />
                      {loading === 'business' ? 'Loading...' : 'Upgrade to Business - $99/mo'}
                    </Button>
                  </>
                )}

                {subscription.tier === 'pro' && (
                  <>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => handleUpgrade('business')}
                      disabled={loading === 'business'}
                    >
                      <ArrowUpRight className="w-5 h-5 mr-2" />
                      {loading === 'business' ? 'Loading...' : 'Upgrade to Business - $99/mo'}
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      size="lg"
                      onClick={handleManageSubscription}
                      disabled={loading === 'portal'}
                    >
                      <Settings className="w-5 h-5 mr-2" />
                      {loading === 'portal' ? 'Loading...' : 'Manage Subscription or Downgrade'}
                    </Button>
                  </>
                )}

                {subscription.tier === 'business' && subscription.subscribed && (
                  <Button
                    className="w-full"
                    variant="outline"
                    size="lg"
                    onClick={handleManageSubscription}
                    disabled={loading === 'portal'}
                  >
                    <Settings className="w-5 h-5 mr-2" />
                    {loading === 'portal' ? 'Loading...' : 'Manage Subscription or Downgrade'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Info</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credits Used</p>
                <p className="font-medium">{credits.credits_used}</p>
              </div>
            </CardContent>
          </Card>

          {/* Billing Management Card - Only show for subscribed users */}
          {subscription.subscribed && (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Billing & Subscription Management</CardTitle>
                <CardDescription>
                  Access your Stripe customer portal to manage payment methods, view invoices, and update billing information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={loading === 'portal'}
                >
                  <Settings className="w-5 h-5 mr-2" />
                  {loading === 'portal' ? 'Loading...' : 'Open Stripe Customer Portal'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Usage History */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="w-5 h-5" />
                <CardTitle>Usage History</CardTitle>
              </div>
              <CardDescription>
                Your recent design generations and credit usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading usage history...
                </div>
              ) : usageHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No usage history yet. Start creating designs to see your activity here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead className="text-right">Credits Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usageHistory.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {new Date(log.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>
                            <span className="capitalize">
                              {log.action_type.replace(/_/g, ' ')}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">
                              -{log.credits_cost} credit{log.credits_cost !== 1 ? 's' : ''}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" onClick={() => navigate('/')}>
                View Projects
              </Button>
              <Button variant="outline" onClick={() => navigate('/favorites')}>
                My Favorites
              </Button>
              <Button variant="outline" onClick={() => navigate('/pricing')}>
                View All Plans
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
