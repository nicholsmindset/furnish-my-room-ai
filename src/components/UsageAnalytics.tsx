import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Sparkles,
  Home,
  Clock,
  Target,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface UsageData {
  totalGenerations: number;
  thisMonthGenerations: number;
  lastMonthGenerations: number;
  averagePerDay: number;
  favoriteStyle: string;
  favoriteRoomType: string;
  styleBreakdown: Record<string, number>;
  roomTypeBreakdown: Record<string, number>;
  dailyUsage: { date: string; count: number }[];
  recentActivity: { date: string; style: string; roomType: string }[];
}

type TimeRange = "7d" | "30d" | "90d" | "all";

export default function UsageAnalytics() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUsageData();
    }
  }, [user, timeRange]);

  const loadUsageData = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      let startDate: Date;
      switch (timeRange) {
        case "7d":
          startDate = subDays(now, 7);
          break;
        case "30d":
          startDate = subDays(now, 30);
          break;
        case "90d":
          startDate = subDays(now, 90);
          break;
        default:
          startDate = new Date(0);
      }

      // Fetch all generations in time range
      const { data: generations, error } = await supabase
        .from("design_generations")
        .select("id, style, room_type, created_at")
        .eq("user_id", user?.id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculate stats
      const styleCount: Record<string, number> = {};
      const roomTypeCount: Record<string, number> = {};
      const dailyCount: Record<string, number> = {};

      (generations || []).forEach((gen) => {
        // Style breakdown
        styleCount[gen.style] = (styleCount[gen.style] || 0) + 1;

        // Room type breakdown
        roomTypeCount[gen.room_type] = (roomTypeCount[gen.room_type] || 0) + 1;

        // Daily usage
        const dateKey = format(new Date(gen.created_at), "yyyy-MM-dd");
        dailyCount[dateKey] = (dailyCount[dateKey] || 0) + 1;
      });

      // Find favorites
      const favoriteStyle = Object.entries(styleCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
      const favoriteRoomType = Object.entries(roomTypeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

      // Calculate this month vs last month
      const thisMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subDays(thisMonthStart, 1));
      const lastMonthEnd = endOfMonth(lastMonthStart);

      const thisMonthGens = (generations || []).filter(
        (g) => new Date(g.created_at) >= thisMonthStart
      ).length;

      const { data: lastMonthData } = await supabase
        .from("design_generations")
        .select("id", { count: "exact" })
        .eq("user_id", user?.id)
        .gte("created_at", lastMonthStart.toISOString())
        .lte("created_at", lastMonthEnd.toISOString());

      // Build daily usage array for chart
      const days = eachDayOfInterval({ start: startDate, end: now });
      const dailyUsage = days.map((day) => ({
        date: format(day, "MMM d"),
        count: dailyCount[format(day, "yyyy-MM-dd")] || 0,
      }));

      // Recent activity
      const recentActivity = (generations || []).slice(0, 5).map((gen) => ({
        date: format(new Date(gen.created_at), "MMM d, h:mm a"),
        style: gen.style,
        roomType: gen.room_type,
      }));

      // Days with activity
      const daysWithActivity = Object.keys(dailyCount).length;
      const avgPerDay = daysWithActivity > 0 ? (generations?.length || 0) / daysWithActivity : 0;

      setData({
        totalGenerations: generations?.length || 0,
        thisMonthGenerations: thisMonthGens,
        lastMonthGenerations: lastMonthData?.length || 0,
        averagePerDay: Math.round(avgPerDay * 10) / 10,
        favoriteStyle,
        favoriteRoomType,
        styleBreakdown: styleCount,
        roomTypeBreakdown: roomTypeCount,
        dailyUsage,
        recentActivity,
      });
    } catch (error) {
      console.error("Error loading usage data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatStyleName = (style: string) => {
    return style.charAt(0).toUpperCase() + style.slice(1).replace(/-/g, " ");
  };

  const getGrowthPercentage = () => {
    if (!data || data.lastMonthGenerations === 0) return null;
    const growth = ((data.thisMonthGenerations - data.lastMonthGenerations) / data.lastMonthGenerations) * 100;
    return Math.round(growth);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const growth = getGrowthPercentage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            Usage Analytics
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Track your design generation activity
          </p>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.totalGenerations || 0}</p>
              <p className="text-xs text-muted-foreground">Total Designs</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.thisMonthGenerations || 0}</p>
              <p className="text-xs text-muted-foreground">
                This Month
                {growth !== null && (
                  <span className={growth >= 0 ? "text-green-500" : "text-red-500"}>
                    {" "}({growth >= 0 ? "+" : ""}{growth}%)
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.averagePerDay || 0}</p>
              <p className="text-xs text-muted-foreground">Avg Per Day</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-lg font-bold capitalize truncate">{formatStyleName(data?.favoriteStyle || "N/A")}</p>
              <p className="text-xs text-muted-foreground">Top Style</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Chart (Simple bar visualization) */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Daily Activity</h4>
        <div className="h-32 flex items-end gap-1">
          {data?.dailyUsage.slice(-14).map((day, i) => {
            const maxCount = Math.max(...(data?.dailyUsage.map((d) => d.count) || [1]));
            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-accent/80 rounded-t transition-all hover:bg-accent"
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${day.date}: ${day.count} designs`}
                />
                {i % 2 === 0 && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {day.date.split(" ")[0]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Style Breakdown */}
        <Card className="p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Style Breakdown
          </h4>
          <div className="space-y-3">
            {Object.entries(data?.styleBreakdown || {})
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([style, count]) => {
                const total = data?.totalGenerations || 1;
                const percentage = Math.round((count / total) * 100);
                return (
                  <div key={style} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{formatStyleName(style)}</span>
                      <span className="text-muted-foreground">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {Object.keys(data?.styleBreakdown || {}).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No data yet
              </p>
            )}
          </div>
        </Card>

        {/* Room Type Breakdown */}
        <Card className="p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Home className="w-4 h-4" />
            Room Type Breakdown
          </h4>
          <div className="space-y-3">
            {Object.entries(data?.roomTypeBreakdown || {})
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([roomType, count]) => {
                const total = data?.totalGenerations || 1;
                const percentage = Math.round((count / total) * 100);
                return (
                  <div key={roomType} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{formatStyleName(roomType)}</span>
                      <span className="text-muted-foreground">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {Object.keys(data?.roomTypeBreakdown || {}).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No data yet
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Activity
        </h4>
        {data?.recentActivity && data.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {data.recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {formatStyleName(activity.style)} - {formatStyleName(activity.roomType)}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        )}
      </Card>
    </div>
  );
}
