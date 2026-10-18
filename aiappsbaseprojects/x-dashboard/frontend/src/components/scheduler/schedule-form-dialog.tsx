"use client";

import { useEffect, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import type { ScheduledPost } from "@/lib/types";
import { useCreateScheduledPost, useUpdateScheduledPost } from "@/hooks/use-scheduler";
import { formatDate } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface ScheduleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduledPost?: ScheduledPost;
}

function toTimeInputValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

export function ScheduleFormDialog({
  open,
  onOpenChange,
  scheduledPost,
}: ScheduleFormDialogProps) {
  const [text, setText] = useState("");
  const [date, setDate] = useState<Date>(() => new Date());
  const [time, setTime] = useState("09:00");

  const createScheduledPost = useCreateScheduledPost();
  const updateScheduledPost = useUpdateScheduledPost();
  const isPending = createScheduledPost.isPending || updateScheduledPost.isPending;
  const isEditing = Boolean(scheduledPost);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (scheduledPost) {
      const scheduledDate = new Date(scheduledPost.scheduledFor);
      setText(scheduledPost.text);
      setDate(scheduledDate);
      setTime(toTimeInputValue(scheduledDate));
    } else {
      const inOneHour = new Date(Date.now() + 60 * 60 * 1000);
      setText("");
      setDate(inOneHour);
      setTime(toTimeInputValue(inOneHour));
    }
  }, [open, scheduledPost]);

  function handleSubmit() {
    if (!text.trim()) {
      toast.error("Write something to schedule.");
      return;
    }

    const [hours, minutes] = time.split(":").map(Number);
    const scheduledFor = new Date(date);
    scheduledFor.setHours(hours, minutes, 0, 0);

    if (scheduledFor.getTime() <= Date.now()) {
      toast.error("Pick a time in the future.");
      return;
    }

    const action =
      isEditing && scheduledPost
        ? updateScheduledPost.mutateAsync({
            id: scheduledPost.id,
            payload: {
              text,
              mediaIds: scheduledPost.mediaIds,
              scheduledFor: scheduledFor.toISOString(),
            },
          })
        : createScheduledPost.mutateAsync({
            type: "Text",
            text,
            mediaIds: [],
            scheduledFor: scheduledFor.toISOString(),
          });

    action
      .then(() => {
        toast.success(isEditing ? "Scheduled post updated" : "Post scheduled");
        onOpenChange(false);
      })
      .catch(() => toast.error("Something went wrong. Please try again."));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit scheduled post" : "Schedule a post"}</DialogTitle>
          <DialogDescription>
            Choose when this post should go out.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="What do you want to share?"
            rows={4}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="h-4 w-4" />
                    {formatDate(date.toISOString())}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(value) => value && setDate(value)}
                    disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isEditing ? "Save changes" : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
