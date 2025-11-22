import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, DollarSign, Image, TrendingUp, Crown, Zap, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

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

const COLORS = ['hsl(var(--accent))', 'hsl(var(--primary))', 'hsl(var(--muted))'];

export default function AdminDashboard() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [designStats, setDesignStats] = useState<DesignStats[]>([]);
  const [subscriptionMetrics, setSubscriptionMetrics] = useState<SubscriptionMetrics[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);

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

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
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
            <Tabs defaultValue="growth" className="space-y-6">
              <TabsList>
                <TabsTrigger value="growth">User Growth</TabsTrigger>
                <TabsTrigger value="designs">Design Activity</TabsTrigger>
                <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                <TabsTrigger value="users">Top Users</TabsTrigger>
              </TabsList>

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
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
