"use client";

import { Eye, Heart, Trash2 } from "lucide-react";

import type { Short } from "@/lib/types";
import { formatCompactNumber } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ShortCardProps {
  short: Short;
  onDelete?: (short: Short) => void;
}

export function ShortCard({ short, onDelete }: ShortCardProps) {
  const videoUrl = short.videoUrl;

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[9/16] bg-muted">
        <video
          src={videoUrl}
          poster={short.thumbnailUrl}
          controls
          muted
          className="h-full w-full object-cover"
        />
        {onDelete && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8"
            onClick={() => onDelete(short)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <CardContent className="space-y-2 p-3">
        <p className="line-clamp-2 text-sm font-medium">{short.caption}</p>
        <div className="flex flex-wrap gap-1">
          {short.hashtags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {formatCompactNumber(short.views)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {formatCompactNumber(short.likes)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
