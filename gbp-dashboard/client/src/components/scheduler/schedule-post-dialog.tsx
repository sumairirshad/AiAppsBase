"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { combineDateAndTime } from "@/lib/combine-date-time";
import { schedulePost } from "@/lib/data/posts";
import { Post } from "@/types/post";

interface SchedulePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedulablePosts: Post[];
  onScheduled: () => void;
}

export function SchedulePostDialog({
  open,
  onOpenChange,
  schedulablePosts,
  onScheduled,
}: SchedulePostDialogProps) {
  const [selectedPostId, setSelectedPostId] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("09:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSchedule() {
    if (!selectedPostId || !date) {
      toast.error("Choose a post and a date");
      return;
    }

    setIsSubmitting(true);
    try {
      await schedulePost(selectedPostId, combineDateAndTime(date, time));
      toast.success("Post scheduled");
      onScheduled();
      onOpenChange(false);
      setSelectedPostId("");
    } catch {
      toast.error("Could not schedule post");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule a post</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="post">Post</Label>
            <Select
              value={selectedPostId}
              onValueChange={(value) => setSelectedPostId(value ?? "")}
            >
              <SelectTrigger id="post">
                <SelectValue placeholder="Choose a post">
                  {(value: string | null) =>
                    schedulablePosts.find((post) => post.id === value)?.title ??
                    "Choose a post"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {schedulablePosts.map((post) => (
                  <SelectItem key={post.id} value={post.id}>
                    {post.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {schedulablePosts.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Create a draft post first on the Posts page.
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={{ before: new Date(new Date().toDateString()) }}
              className="rounded-md border"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={isSubmitting}>
            {isSubmitting ? "Scheduling..." : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
