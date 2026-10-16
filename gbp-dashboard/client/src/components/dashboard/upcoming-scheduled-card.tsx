import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostTypeBadge } from "@/components/posts/post-badges";
import { formatDateTime } from "@/lib/format";
import { Post } from "@/types/post";

export function UpcomingScheduledCard({ posts }: { posts: Post[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upcoming scheduled posts</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/scheduler">View scheduler</Link>}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nothing scheduled right now.
          </p>
        )}
        {posts.map((post) => (
          <div key={post.id} className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <PostTypeBadge type={post.type} />
              </div>
              <p className="text-sm font-medium">{post.title}</p>
            </div>
            <p className="whitespace-nowrap text-xs text-muted-foreground">
              {formatDateTime(post.scheduledAt)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
