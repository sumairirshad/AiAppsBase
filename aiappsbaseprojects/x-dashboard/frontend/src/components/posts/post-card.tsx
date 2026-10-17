"use client";

import Image from "next/image";
import { Heart, MessageCircle, Pin, Repeat2, BarChart3, Pencil, Trash2 } from "lucide-react";

import type { Post } from "@/lib/types";
import { formatCompactNumber, formatDateTime } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PostCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  onTogglePin?: (post: Post) => void;
}

export function PostCard({ post, onEdit, onDelete, onTogglePin }: PostCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {post.isPinned && (
              <Badge variant="secondary" className="gap-1">
                <Pin className="h-3 w-3" />
                Pinned
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {formatDateTime(post.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {onTogglePin && (
              <Button variant="ghost" size="icon" onClick={() => onTogglePin(post)}>
                <Pin className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={() => onEdit(post)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={() => onDelete(post)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.text}</p>

        {post.imageUrls.length > 0 && (
          <div
            className={
              post.imageUrls.length > 1
                ? "grid grid-cols-2 gap-2"
                : "grid grid-cols-1"
            }
          >
            {post.imageUrls.map((url) => (
              <div key={url} className="relative aspect-video overflow-hidden rounded-lg">
                <Image src={url} alt="" fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-6 pt-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4" />
            {formatCompactNumber(post.replies)}
          </span>
          <span className="flex items-center gap-1.5">
            <Repeat2 className="h-4 w-4" />
            {formatCompactNumber(post.reposts)}
          </span>
          <span className="flex items-center gap-1.5">
            <Heart className="h-4 w-4" />
            {formatCompactNumber(post.likes)}
          </span>
          <span className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            {formatCompactNumber(post.views)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
