"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { usePosts, useDeletePost, usePinPost } from "@/hooks/use-posts";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/posts/post-card";
import { PostFormDialog } from "@/components/posts/post-form-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function PostsPage() {
  const { data: posts, isLoading } = usePosts();
  const deletePost = useDeletePost();
  const pinPost = usePinPost();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | undefined>();
  const [deletingPost, setDeletingPost] = useState<Post | undefined>();

  function openCreate() {
    setEditingPost(undefined);
    setFormOpen(true);
  }

  function openEdit(post: Post) {
    setEditingPost(post);
    setFormOpen(true);
  }

  function handleTogglePin(post: Post) {
    pinPost.mutate(post.id, {
      onSuccess: () =>
        toast.success(post.isPinned ? "Post unpinned" : "Post pinned"),
    });
  }

  function handleDeleteConfirmed() {
    if (!deletingPost) {
      return;
    }
    deletePost.mutate(deletingPost.id, {
      onSuccess: () => {
        toast.success("Post deleted");
        setDeletingPost(undefined);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {posts?.length ?? 0} posts
        </p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New post
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}

        {posts?.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onEdit={openEdit}
            onDelete={setDeletingPost}
            onTogglePin={handleTogglePin}
          />
        ))}

        {posts?.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No posts yet. Create your first one.
          </p>
        )}
      </div>

      <PostFormDialog open={formOpen} onOpenChange={setFormOpen} post={editingPost} />

      <ConfirmDialog
        open={Boolean(deletingPost)}
        onOpenChange={(open) => !open && setDeletingPost(undefined)}
        title="Delete post?"
        description="This action cannot be undone."
        onConfirm={handleDeleteConfirmed}
        isPending={deletePost.isPending}
      />
    </div>
  );
}
