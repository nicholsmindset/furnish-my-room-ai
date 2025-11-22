import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, DollarSign, Image, TrendingUp, Crown, Zap, Sparkles, Edit, RefreshCw, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

interface AdminAnalytics {
  total_users: number;
  active_subscriptions: number;
  pro_subscribers: number;
  business_subscribers: number;
  total_designs: number;
  designs_last_30_days: number;
  designs_last_7_days: number;
  new_users_30_days: number;
  new_users_7_days: number;
  total_credits_used: number;
  avg_credits_per_user: number;
}

interface UserGrowthData {
  date: string;
  new_users: number;
  total_users: number;
}

interface DesignStats {
  date: string;
  designs_generated: number;
  unique_users: number;
}

interface SubscriptionMetrics {
  tier: string;
  active_count: number;
  monthly_revenue: number;
}

interface TopUser {
  user_email: string;
  design_count: number;
  subscription_tier: string;
  credits_used: number;
}

interface User {
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  subscription_tier: string;
  is_active: boolean;
  subscription_end: string | null;
  stripe_product_id: string | null;
  credits_remaining: number;
  credits_used: number;
  design_count: number;
  user_role: string;
}

const COLORS = ['hsl(var(--accent))', 'hsl(var(--primary))', 'hsl(var(--muted))'];

export default function AdminDashboard() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [designStats, setDesignStats] = useState<DesignStats[]>([]);
  const [subscriptionMetrics, setSubscriptionMetrics] = useState<SubscriptionMetrics[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editSubDialog, setEditSubDialog] = useState(false);
  const [editRoleDialog, setEditRoleDialog] = useState(false);
  const [editCreditsDialog, setEditCreditsDialog] = useState(false);
  const [refundDialog, setRefundDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch main analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('admin_analytics')
        .select('*')
        .single();

      if (analyticsError) throw analyticsError;
      setAnalytics(analyticsData);

      // Fetch user growth
      const { data: growthData, error: growthError } = await supabase.rpc('get_user_growth_data');
      if (growthError) throw growthError;
      setUserGrowth(growthData || []);

      // Fetch design stats
      const { data: designData, error: designError } = await supabase.rpc('get_design_generation_stats');
      if (designError) throw designError;
      setDesignStats(designData || []);

      // Fetch subscription metrics
      const { data: subData, error: subError } = await supabase.rpc('get_subscription_metrics');
      if (subError) throw subError;
      setSubscriptionMetrics(subData || []);

      // Fetch top users
      const { data: topUsersData, error: topUsersError } = await supabase.rpc('get_top_users_by_designs', { limit_count: 10 });
      if (topUsersError) throw topUsersError;
      setTopUsers(topUsersData || []);

      // Fetch all users for management
      const { data: allUsersData, error: allUsersError } = await supabase.rpc('get_all_users_admin');
      if (allUsersError) throw allUsersError;
      setAllUsers(allUsersData || []);

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (userId: string, tier: string, isActive: boolean) => {
    try {
      const { error } = await supabase.rpc('admin_update_user_subscription', {
        _user_id: userId,
        _subscription_tier: tier as 'free' | 'pro' | 'business' | 'admin',
        _is_active: isActive,
        _stripe_product_id: null,
        _subscription_end: isActive ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
      });

      if (error) throw error;

      toast({ title: "Subscription updated successfully" });
      setEditSubDialog(false);
      fetchAllData();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({ title: "Failed to update subscription", variant: "destructive" });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.rpc('admin_update_user_role', {
        _user_id: userId,
        _new_role: newRole as 'free' | 'pro' | 'business' | 'admin'
      });

      if (error) throw error;

      toast({ title: "User role updated successfully" });
      setEditRoleDialog(false);
      fetchAllData();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({ title: "Failed to update role", variant: "destructive" });
    }
  };

  const handleUpdateCredits = async (userId: string, credits: number) => {
    try {
      const { error } = await supabase.rpc('admin_update_user_credits', {
        _user_id: userId,
        _credits_remaining: credits
      });

      if (error) throw error;

      toast({ title: "Credits updated successfully" });
      setEditCreditsDialog(false);
      fetchAllData();
    } catch (error) {
      console.error('Error updating credits:', error);
      toast({ title: "Failed to update credits", variant: "destructive" });
    }
  };

  const handleRefund = async (paymentIntentId: string, amount?: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-refund-payment', {
        body: { payment_intent_id: paymentIntentId, amount, reason: 'requested_by_customer' }
      });

      if (error) throw error;

      toast({ title: "Refund processed successfully" });
      setRefundDialog(false);
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({ title: "Failed to process refund", variant: "destructive" });
    }
  };

  if (adminLoading || !isAdmin) {
    return null;
  }

  const totalRevenue = subscriptionMetrics.reduce((sum, item) => sum + Number(item.monthly_revenue), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Admin Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
              {selectedTab !== "overview" && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="capitalize">{selectedTab}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Monitor platform performance and user engagement</p>
          </div>
          <Badge variant="secondary" className="px-4 py-2">
            <Crown className="w-4 h-4 mr-2" />
            Admin Access
          </Badge>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics?.total_users || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    +{analytics?.new_users_7_days || 0} this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-accent" />
                    Active Subscriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics?.active_subscriptions || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics?.pro_subscribers || 0} Pro, {analytics?.business_subscribers || 0} Business
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Image className="w-4 h-4 text-accent" />
                    Designs Generated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics?.total_designs || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics?.designs_last_7_days || 0} this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-accent" />
                    Monthly Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recurring monthly
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Tables */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="growth">User Growth</TabsTrigger>
                <TabsTrigger value="designs">Design Activity</TabsTrigger>
                <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                <TabsTrigger value="users">Top Users</TabsTrigger>
                <TabsTrigger value="management">User Management</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Overview</CardTitle>
                    <CardDescription>Quick summary of key metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        View detailed analytics in other tabs or manage users directly.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="growth" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth (Last 30 Days)</CardTitle>
                    <CardDescription>New sign-ups and total user base over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="new_users" 
                          stroke="hsl(var(--accent))" 
                          strokeWidth={2}
                          name="New Users"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="total_users" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name="Total Users"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="designs" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Design Generation Activity</CardTitle>
                    <CardDescription>Daily designs generated and unique active users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={designStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <Legend />
                        <Bar dataKey="designs_generated" fill="hsl(var(--accent))" name="Designs Generated" />
                        <Bar dataKey="unique_users" fill="hsl(var(--primary))" name="Active Users" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Credits Used</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.total_credits_used || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Avg Credits per User</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.avg_credits_per_user || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Designs Last 30 Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.designs_last_30_days || 0}</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="subscriptions" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Subscription Distribution</CardTitle>
                      <CardDescription>Active subscribers by tier</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={subscriptionMetrics}
                            dataKey="active_count"
                            nameKey="tier"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={(entry) => `${entry.tier}: ${entry.active_count}`}
                          >
                            {subscriptionMetrics.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Breakdown</CardTitle>
                      <CardDescription>Monthly recurring revenue by tier</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {subscriptionMetrics.map((metric, index) => (
                          <div key={metric.tier} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              {metric.tier === 'pro' ? (
                                <Zap className="w-5 h-5 text-accent" />
                              ) : metric.tier === 'business' ? (
                                <Crown className="w-5 h-5 text-accent" />
                              ) : (
                                <Sparkles className="w-5 h-5 text-accent" />
                              )}
                              <div>
                                <div className="font-semibold capitalize">{metric.tier}</div>
                                <div className="text-sm text-muted-foreground">
                                  {metric.active_count} subscribers
                                </div>
                              </div>
                            </div>
                            <div className="text-2xl font-bold">
                              ${Number(metric.monthly_revenue).toLocaleString()}
                              <span className="text-sm font-normal text-muted-foreground">/mo</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Users by Designs Generated</CardTitle>
                    <CardDescription>Most active users on the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-right">Designs</TableHead>
                          <TableHead className="text-right">Credits Used</TableHead>
                          <TableHead className="text-right">Tier</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topUsers.map((user, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{user.user_email}</TableCell>
                            <TableCell className="text-right">{user.design_count}</TableCell>
                            <TableCell className="text-right">{user.credits_used}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={user.subscription_tier === 'business' ? 'default' : 'secondary'}>
                                {user.subscription_tier}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="management">
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>View and manage all users, subscriptions, and roles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Subscription</TableHead>
                          <TableHead className="text-right">Credits</TableHead>
                          <TableHead className="text-right">Designs</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allUsers.map((user) => (
                          <TableRow key={user.user_id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>{user.full_name || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {user.user_role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant={user.is_active ? 'default' : 'secondary'} className="capitalize">
                                  {user.subscription_tier}
                                </Badge>
                                {user.is_active && (
                                  <span className="text-xs text-muted-foreground">Active</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{user.credits_remaining}</TableCell>
                            <TableCell className="text-right">{user.design_count}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setEditSubDialog(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setEditRoleDialog(true);
                                  }}
                                >
                                  <Shield className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setEditCreditsDialog(true);
                                  }}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Edit Subscription Dialog */}
        <Dialog open={editSubDialog} onOpenChange={setEditSubDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subscription</DialogTitle>
              <DialogDescription>Update user subscription tier and status</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <Label>User: {selectedUser.email}</Label>
                </div>
                <div>
                  <Label htmlFor="tier">Subscription Tier</Label>
                  <Select
                    defaultValue={selectedUser.subscription_tier}
                    onValueChange={(value) => {
                      if (selectedUser) {
                        setSelectedUser({ ...selectedUser, subscription_tier: value });
                      }
                    }}
                  >
                    <SelectTrigger id="tier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    defaultValue={selectedUser.is_active ? "active" : "inactive"}
                    onValueChange={(value) => {
                      if (selectedUser) {
                        setSelectedUser({ ...selectedUser, is_active: value === "active" });
                      }
                    }}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditSubDialog(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (selectedUser) {
                    handleUpdateSubscription(
                      selectedUser.user_id,
                      selectedUser.subscription_tier,
                      selectedUser.is_active
                    );
                  }
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={editRoleDialog} onOpenChange={setEditRoleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription>Change the user's role in the system</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <Label>User: {selectedUser.email}</Label>
                </div>
                <div>
                  <Label htmlFor="role">User Role</Label>
                  <Select
                    defaultValue={selectedUser.user_role}
                    onValueChange={(value) => {
                      if (selectedUser) {
                        setSelectedUser({ ...selectedUser, user_role: value });
                      }
                    }}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditRoleDialog(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (selectedUser) {
                    handleUpdateRole(selectedUser.user_id, selectedUser.user_role);
                  }
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Credits Dialog */}
        <Dialog open={editCreditsDialog} onOpenChange={setEditCreditsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Credits</DialogTitle>
              <DialogDescription>Adjust the user's available credits</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <Label>User: {selectedUser.email}</Label>
                </div>
                <div>
                  <Label htmlFor="credits">Credits Remaining</Label>
                  <Input
                    id="credits"
                    type="number"
                    defaultValue={selectedUser.credits_remaining}
                    onChange={(e) => {
                      if (selectedUser) {
                        setSelectedUser({
                          ...selectedUser,
                          credits_remaining: parseInt(e.target.value) || 0
                        });
                      }
                    }}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditCreditsDialog(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (selectedUser) {
                    handleUpdateCredits(selectedUser.user_id, selectedUser.credits_remaining);
                  }
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
