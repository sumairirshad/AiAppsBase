"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { DataState } from "@/components/layout/data-state";
import { PostFormDialog } from "@/components/posts/post-form-dialog";
import { PostsTable } from "@/components/posts/posts-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAsyncData } from "@/hooks/use-async-data";
import { createPost, deletePost, getPosts, updatePost } from "@/lib/data/posts";
import { Post, PostDraft } from "@/types/post";

export function PostsView() {
  const { data: posts, isLoading, error, reload } = useAsyncData(getPosts);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  async function handleCreate(draft: PostDraft) {
    await createPost(draft);
    toast.success("Post created");
    reload();
  }

  async function handleUpdate(id: string, draft: PostDraft) {
    await updatePost(id, draft);
    toast.success("Post updated");
    reload();
  }

  async function handleDelete(post: Post) {
    await deletePost(post.id);
    toast.success("Post deleted");
    reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Create and manage Update, Event, and Offer posts for your business
          profile.
        </p>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="size-4" />
          New post
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All posts</CardTitle>
        </CardHeader>
        <CardContent>
          <DataState isLoading={isLoading} error={error}>
            {posts && (
              <PostsTable
                posts={posts}
                onEdit={setEditingPost}
                onDelete={handleDelete}
              />
            )}
          </DataState>
        </CardContent>
      </Card>

      <PostFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="New post"
        submitLabel="Create post"
        onSubmit={handleCreate}
      />

      {editingPost && (
        <PostFormDialog
          open={Boolean(editingPost)}
          onOpenChange={(open) => !open && setEditingPost(null)}
          title="Edit post"
          submitLabel="Save changes"
          initialDraft={editingPost}
          onSubmit={(draft) => handleUpdate(editingPost.id, draft)}
        />
      )}
    </div>
  );
}
