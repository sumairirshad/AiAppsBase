"use client";

import { toast } from "sonner";

import { PostTypeBadge } from "@/components/posts/post-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/format";
import { publishPostNow } from "@/lib/data/posts";
import { Post } from "@/types/post";

interface SchedulerListProps {
  scheduledPosts: Post[];
  publishedPosts: Post[];
  onChanged: () => void;
}

export function SchedulerList({
  scheduledPosts,
  publishedPosts,
  onChanged,
}: SchedulerListProps) {
  async function handlePublishNow(post: Post) {
    await publishPostNow(post.id);
    toast.success(`${post.title} published`);
    onChanged();
  }

  return (
    <Tabs defaultValue="scheduled">
      <TabsList>
        <TabsTrigger value="scheduled">
          Scheduled ({scheduledPosts.length})
        </TabsTrigger>
        <TabsTrigger value="published">
          Published ({publishedPosts.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="scheduled" className="flex flex-col gap-3">
        {scheduledPosts.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No posts scheduled yet.
          </p>
        )}
        {scheduledPosts.map((post) => (
          <Card key={post.id}>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <PostTypeBadge type={post.type} />
                  <span className="text-sm font-medium">{post.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Scheduled for {formatDateTime(post.scheduledAt)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePublishNow(post)}
              >
                Publish now
              </Button>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="published" className="flex flex-col gap-3">
        {publishedPosts.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No posts published yet.
          </p>
        )}
        {publishedPosts.map((post) => (
          <Card key={post.id}>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <PostTypeBadge type={post.type} />
                  <span className="text-sm font-medium">{post.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Published {formatDateTime(post.publishedAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  );
}
