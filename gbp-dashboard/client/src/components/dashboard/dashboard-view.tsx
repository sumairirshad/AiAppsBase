"use client";

import { Images, LayoutList, Megaphone, PenLine } from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { RecentPostsCard } from "@/components/dashboard/recent-posts-card";
import { UpcomingScheduledCard } from "@/components/dashboard/upcoming-scheduled-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { DataState } from "@/components/layout/data-state";
import { useAsyncData } from "@/hooks/use-async-data";
import { getDashboardOverview } from "@/lib/data/dashboard";

export function DashboardView() {
  const { data, isLoading, error } = useAsyncData(getDashboardOverview);

  return (
    <DataState isLoading={isLoading} error={error}>
      {data && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <Avatar className="size-14">
                <AvatarImage src={data.profile.logoUrl} alt={data.profile.name} />
                <AvatarFallback>{data.profile.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">{data.profile.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {data.profile.category} · {data.profile.city}, {data.profile.state}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total posts" value={data.totalPosts} icon={Megaphone} />
            <StatCard
              title="Scheduled"
              value={data.scheduledPostsCount}
              icon={LayoutList}
            />
            <StatCard
              title="Published"
              value={data.publishedPostsCount}
              icon={PenLine}
            />
            <StatCard title="Media items" value={data.mediaCount} icon={Images} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <RecentPostsCard posts={data.recentPosts} />
            <UpcomingScheduledCard posts={data.upcomingScheduledPosts} />
          </div>
        </div>
      )}
    </DataState>
  );
}
