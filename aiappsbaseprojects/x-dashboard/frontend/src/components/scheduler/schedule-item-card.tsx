"use client";

import { AlertCircle, CheckCircle2, Pencil, Send, Trash2 } from "lucide-react";

import type { ScheduledPost } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ScheduleItemCardProps {
  item: ScheduledPost;
  onEdit?: (item: ScheduledPost) => void;
  onCancel?: (item: ScheduledPost) => void;
  onPublishNow?: (item: ScheduledPost) => void;
}

export function ScheduleItemCard({
  item,
  onEdit,
  onCancel,
  onPublishNow,
}: ScheduleItemCardProps) {
  const isScheduled = item.status === "Scheduled";
  const isFailed = item.status === "Failed";

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant={isScheduled ? "secondary" : isFailed ? "destructive" : "outline"}>
              {isScheduled ? "Scheduled" : item.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(item.scheduledFor)}
            </span>
          </div>
          <p className="text-sm">{item.text}</p>
          {isFailed && item.failureReason && (
            <p className="text-xs text-destructive">{item.failureReason}</p>
          )}
        </div>

        {isScheduled && (
          <div className="flex shrink-0 items-center gap-1">
            {onPublishNow && (
              <Button variant="ghost" size="icon" onClick={() => onPublishNow(item)}>
                <Send className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onCancel && (
              <Button variant="ghost" size="icon" onClick={() => onCancel(item)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {!isScheduled && !isFailed && (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
        )}
        {isFailed && <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />}
      </CardContent>
    </Card>
  );
}
