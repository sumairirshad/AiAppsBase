"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";

import { DataState } from "@/components/layout/data-state";
import { SchedulePostDialog } from "@/components/scheduler/schedule-post-dialog";
import { SchedulerCalendar } from "@/components/scheduler/scheduler-calendar";
import { SchedulerList } from "@/components/scheduler/scheduler-list";
import { Button } from "@/components/ui/button";
import { useAsyncData } from "@/hooks/use-async-data";
import { getPosts } from "@/lib/data/posts";

export function SchedulerView() {
  const { data: posts, isLoading, error, reload } = useAsyncData(getPosts);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const scheduledPosts = posts?.filter((post) => post.status === "Scheduled") ?? [];
  const publishedPosts = posts?.filter((post) => post.status === "Published") ?? [];
  const schedulablePosts =
    posts?.filter((post) => post.status === "Draft" || post.status === "Scheduled") ??
    [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Pick a date and time to schedule a post, then track scheduled vs.
          published items below.
        </p>
        <Button onClick={() => setIsScheduleOpen(true)}>
          <CalendarPlus className="size-4" />
          Schedule a post
        </Button>
      </div>

      <DataState isLoading={isLoading} error={error}>
        {posts && (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <SchedulerCalendar
              scheduledPosts={scheduledPosts}
              publishedPosts={publishedPosts}
            />
            <SchedulerList
              scheduledPosts={scheduledPosts}
              publishedPosts={publishedPosts}
              onChanged={reload}
            />
          </div>
        )}
      </DataState>

      <SchedulePostDialog
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        schedulablePosts={schedulablePosts}
        onScheduled={reload}
      />
    </div>
  );
}
