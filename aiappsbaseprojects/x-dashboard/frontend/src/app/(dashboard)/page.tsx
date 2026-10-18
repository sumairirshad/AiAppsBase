"use client";

import Link from "next/link";
import {
  CalendarClock,
  Eye,
  Heart,
  Repeat2,
  FileText,
  Clapperboard,
} from "lucide-react";

import { useDashboardSummary } from "@/hooks/use-dashboard-summary";
import { StatCard } from "@/components/dashboard/stat-card";
import { EngagementChart } from "@/components/dashboard/engagement-chart";
import { PostCard } from "@/components/posts/post-card";
import { ApiErrorState } from "@/components/common/api-error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCompactNumber, formatDateTime } from "@/lib/format";

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return <ApiErrorState error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Total posts" value={String(data.totalPosts)} icon={FileText} />
        <StatCard label="Total shorts" value={String(data.totalShorts)} icon={Clapperboard} />
        <StatCard
          label="Scheduled"
          value={String(data.scheduledCount)}
          icon={CalendarClock}
        />
        <StatCard
          label="Total likes"
          value={formatCompactNumber(data.totalLikes)}
          icon={Heart}
        />
        <StatCard
          label="Total reposts"
          value={formatCompactNumber(data.totalReposts)}
          icon={Repeat2}
        />
        <StatCard
          label="Total views"
          value={formatCompactNumber(data.totalViews)}
          icon={Eye}
        />
      </div>

      <EngagementChart data={data.engagementOverTime} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent posts</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/posts">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentPosts.slice(0, 3).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming scheduled</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/scheduler">Open scheduler</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.upcomingScheduled.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing scheduled yet.
              </p>
            )}
            {data.upcomingScheduled.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(item.scheduledFor)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
