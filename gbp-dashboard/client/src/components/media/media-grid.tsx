import { PlayCircle, Trash2 } from "lucide-react";

import {
  MediaCategoryBadge,
  MediaTypeBadge,
} from "@/components/media/media-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { MediaItem } from "@/types/media";

interface MediaGridProps {
  items: MediaItem[];
  onDelete: (item: MediaItem) => void;
}

export function MediaGrid({ items, onDelete }: MediaGridProps) {
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No media yet. Add your first photo or video.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <div className="relative aspect-video bg-muted">
            <img
              src={item.thumbnailUrl}
              alt={item.caption}
              className="size-full object-cover"
            />
            {item.type === "Video" && (
              <PlayCircle className="absolute inset-0 m-auto size-10 text-white drop-shadow" />
            )}
          </div>
          <CardContent className="flex flex-col gap-2 pt-4">
            <div className="flex items-center gap-2">
              <MediaTypeBadge type={item.type} />
              <MediaCategoryBadge category={item.category} />
            </div>
            <p className="text-sm font-medium">{item.caption}</p>
            <p className="text-xs text-muted-foreground">
              Uploaded {formatDate(item.uploadedAt)}
            </p>
          </CardContent>
          <CardFooter className="justify-end">
            <Button variant="ghost" size="sm" onClick={() => onDelete(item)}>
              <Trash2 className="size-4" />
              Remove
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
