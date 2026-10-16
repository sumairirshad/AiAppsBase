import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PostStatusBadge,
  PostTypeBadge,
} from "@/components/posts/post-badges";
import { formatDateTime } from "@/lib/format";
import { Post } from "@/types/post";

export function RecentPostsCard({ posts }: { posts: Post[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent posts</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        )}
        {posts.map((post) => (
          <div key={post.id} className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <PostTypeBadge type={post.type} />
                <PostStatusBadge status={post.status} />
              </div>
              <p className="text-sm font-medium">{post.title}</p>
              <p className="text-xs text-muted-foreground">
                Updated {formatDateTime(post.updatedAt)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
