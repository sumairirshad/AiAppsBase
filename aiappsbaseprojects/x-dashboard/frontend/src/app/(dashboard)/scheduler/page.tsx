"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  useScheduledPosts,
  useCancelScheduledPost,
  usePublishScheduledPostNow,
} from "@/hooks/use-scheduler";
import type { ScheduledPost } from "@/lib/types";
import { ScheduleItemCard } from "@/components/scheduler/schedule-item-card";
import { ScheduleFormDialog } from "@/components/scheduler/schedule-form-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ApiErrorState } from "@/components/common/api-error-state";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function SchedulerPage() {
  const { data: items, isLoading, isError, error, refetch } = useScheduledPosts();
  const cancelScheduledPost = useCancelScheduledPost();
  const publishNow = usePublishScheduledPostNow();

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduledPost | undefined>();
  const [cancelingItem, setCancelingItem] = useState<ScheduledPost | undefined>();
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const scheduled = useMemo(
    () => items?.filter((item) => item.status === "Scheduled") ?? [],
    [items]
  );
  const published = useMemo(
    () => items?.filter((item) => item.status !== "Scheduled") ?? [],
    [items]
  );

  const scheduledDays = useMemo(
    () => scheduled.map((item) => new Date(item.scheduledFor)),
    [scheduled]
  );

  const itemsForSelectedDay = useMemo(
    () =>
      (items ?? []).filter((item) =>
        isSameDay(new Date(item.scheduledFor), selectedDay)
      ),
    [items, selectedDay]
  );

  function openCreate() {
    setEditingItem(undefined);
    setFormOpen(true);
  }

  function openEdit(item: ScheduledPost) {
    setEditingItem(item);
    setFormOpen(true);
  }

  function handleCancelConfirmed() {
    if (!cancelingItem) {
      return;
    }
    cancelScheduledPost.mutate(cancelingItem.id, {
      onSuccess: () => {
        toast.success("Scheduled post cancelled");
        setCancelingItem(undefined);
      },
    });
  }

  function handlePublishNow(item: ScheduledPost) {
    publishNow.mutate(item.id, {
      onSuccess: (result) => {
        if (result.status === "Failed") {
          toast.error(result.failureReason ?? "Could not publish this post to X.");
        } else {
          toast.success("Post published now");
        }
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not publish this post."),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {scheduled.length} scheduled &middot; {published.length} published
        </p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Schedule post
        </Button>
      </div>

      {isError && <ApiErrorState error={error} onRetry={refetch} />}

      {!isError && (
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {isLoading &&
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}

          {!isLoading && scheduled.length === 0 && published.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nothing scheduled yet.
            </p>
          )}

          {scheduled.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Upcoming
              </h2>
              {scheduled.map((item) => (
                <ScheduleItemCard
                  key={item.id}
                  item={item}
                  onEdit={openEdit}
                  onCancel={setCancelingItem}
                  onPublishNow={handlePublishNow}
                />
              ))}
            </div>
          )}

          {published.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Published
              </h2>
              {published.map((item) => (
                <ScheduleItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <div className="grid gap-4 lg:grid-cols-[auto,1fr]">
            <Card className="w-fit">
              <CardContent className="p-2">
                <Calendar
                  mode="single"
                  selected={selectedDay}
                  onSelect={(value) => value && setSelectedDay(value)}
                  modifiers={{ scheduled: scheduledDays }}
                  modifiersClassNames={{
                    scheduled: "font-semibold text-primary underline",
                  }}
                />
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">
                {selectedDay.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
              {itemsForSelectedDay.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No posts scheduled or published on this day.
                </p>
              )}
              {itemsForSelectedDay.map((item) => (
                <ScheduleItemCard
                  key={item.id}
                  item={item}
                  onEdit={item.status === "Scheduled" ? openEdit : undefined}
                  onCancel={item.status === "Scheduled" ? setCancelingItem : undefined}
                  onPublishNow={item.status === "Scheduled" ? handlePublishNow : undefined}
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      )}

      <ScheduleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        scheduledPost={editingItem}
      />

      <ConfirmDialog
        open={Boolean(cancelingItem)}
        onOpenChange={(open) => !open && setCancelingItem(undefined)}
        title="Cancel scheduled post?"
        description="This scheduled post will be removed."
        confirmLabel="Cancel post"
        onConfirm={handleCancelConfirmed}
        isPending={cancelScheduledPost.isPending}
      />
    </div>
  );
}
