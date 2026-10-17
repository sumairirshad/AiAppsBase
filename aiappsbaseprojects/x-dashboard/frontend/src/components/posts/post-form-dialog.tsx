"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

import type { Post, PostType } from "@/lib/types";
import { useCreatePost, useUpdatePost } from "@/hooks/use-posts";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

interface PostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: Post;
}

const MAX_POST_LENGTH = 280;

export function PostFormDialog({ open, onOpenChange, post }: PostFormDialogProps) {
  const [type, setType] = useState<PostType>("Text");
  const [text, setText] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const isPending = createPost.isPending || updatePost.isPending;
  const isEditing = Boolean(post);

  useEffect(() => {
    if (!open) {
      return;
    }
    setType(post?.type ?? "Text");
    setText(post?.text ?? "");
    setImageUrls(post?.imageUrls ?? []);
  }, [open, post]);

  function handleFiles(files: FileList | null) {
    if (!files) {
      return;
    }
    const urls = Array.from(files).map((file) => URL.createObjectURL(file));
    setImageUrls((current) => [...current, ...urls]);
  }

  function removeImage(url: string) {
    setImageUrls((current) => current.filter((item) => item !== url));
  }

  function handleSubmit() {
    if (type === "Text" && !text.trim()) {
      toast.error("Write something before posting.");
      return;
    }

    if (type === "Image" && imageUrls.length === 0) {
      toast.error("Add at least one image.");
      return;
    }

    const action =
      isEditing && post
        ? updatePost.mutateAsync({ id: post.id, payload: { text, imageUrls } })
        : createPost.mutateAsync({ type, text, imageUrls });

    action
      .then(() => {
        toast.success(isEditing ? "Post updated" : "Post created");
        onOpenChange(false);
      })
      .catch(() => toast.error("Something went wrong. Please try again."));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit post" : "New post"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your post content below."
              : "Share a text update or attach images."}
          </DialogDescription>
        </DialogHeader>

        {!isEditing && (
          <Tabs value={type} onValueChange={(value) => setType(value as PostType)}>
            <TabsList>
              <TabsTrigger value="Text">Text</TabsTrigger>
              <TabsTrigger value="Image">Image</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="space-y-2">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, MAX_POST_LENGTH))}
            placeholder="What's happening?"
            rows={5}
          />
          <p className="text-right text-xs text-muted-foreground">
            {text.length}/{MAX_POST_LENGTH}
          </p>
        </div>

        {(type === "Image" || imageUrls.length > 0) && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {imageUrls.map((url) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image src={url} alt="" fill className="object-cover" unoptimized />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-1 top-1 h-6 w-6"
                    onClick={() => removeImage(url)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:bg-accent">
                <ImagePlus className="h-5 w-5" />
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => handleFiles(event.target.files)}
                />
              </label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isEditing ? "Save changes" : "Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
