import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Post } from "@/types/post";

interface SchedulerCalendarProps {
  scheduledPosts: Post[];
  publishedPosts: Post[];
}

function toDates(posts: Post[], field: "scheduledAt" | "publishedAt"): Date[] {
  return posts
    .map((post) => post[field])
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value));
}

export function SchedulerCalendar({
  scheduledPosts,
  publishedPosts,
}: SchedulerCalendarProps) {
  const scheduledDates = toDates(scheduledPosts, "scheduledAt");
  const publishedDates = toDates(publishedPosts, "publishedAt");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <Calendar
          modifiers={{ scheduled: scheduledDates, published: publishedDates }}
          modifiersClassNames={{
            scheduled: "bg-amber-200 text-amber-900 rounded-md dark:bg-amber-500/30 dark:text-amber-200",
            published: "bg-emerald-200 text-emerald-900 rounded-md dark:bg-emerald-500/30 dark:text-emerald-200",
          }}
          className="rounded-md border"
        />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-amber-400" /> Scheduled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-400" /> Published
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
