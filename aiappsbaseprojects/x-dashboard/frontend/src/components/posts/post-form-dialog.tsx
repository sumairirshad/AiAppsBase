"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import type { PostType } from "@/lib/types";
import { useCreatePost } from "@/hooks/use-posts";
import { mediaApi, ApiError } from "@/lib/api-client";
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
}

interface UploadedImage {
  mediaId: string;
  previewUrl: string;
}

const MAX_POST_LENGTH = 280;

export function PostFormDialog({ open, onOpenChange }: PostFormDialogProps) {
  const [type, setType] = useState<PostType>("Text");
  const [text, setText] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const createPost = useCreatePost();
  const isPending = createPost.isPending || isUploading;

  useEffect(() => {
    if (!open) {
      return;
    }
    setType("Text");
    setText("");
    setImages([]);
  }, [open]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const previewUrl = URL.createObjectURL(file);
        const { mediaId } = await mediaApi.upload(file, "image");
        setImages((current) => [...current, { mediaId, previewUrl }]);
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not upload image.");
    } finally {
      setIsUploading(false);
    }
  }

  function removeImage(mediaId: string) {
    setImages((current) => current.filter((item) => item.mediaId !== mediaId));
  }

  function handleSubmit() {
    if (type === "Text" && !text.trim()) {
      toast.error("Write something before posting.");
      return;
    }

    if (type === "Image" && images.length === 0) {
      toast.error("Add at least one image.");
      return;
    }

    createPost
      .mutateAsync({ type, text, mediaIds: images.map((image) => image.mediaId) })
      .then(() => {
        toast.success("Post created");
        onOpenChange(false);
      })
      .catch((error) =>
        toast.error(error instanceof ApiError ? error.message : "Something went wrong. Please try again.")
      );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New post</DialogTitle>
          <DialogDescription>
            Share a text update or attach images. This publishes immediately to your connected
            X account.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={type} onValueChange={(value) => setType(value as PostType)}>
          <TabsList>
            <TabsTrigger value="Text">Text</TabsTrigger>
            <TabsTrigger value="Image">Image</TabsTrigger>
          </TabsList>
        </Tabs>

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

        {(type === "Image" || images.length > 0) && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {images.map((image) => (
                <div key={image.mediaId} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image src={image.previewUrl} alt="" fill className="object-cover" unoptimized />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-1 top-1 h-6 w-6"
                    onClick={() => removeImage(image.mediaId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:bg-accent">
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={isUploading}
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
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
