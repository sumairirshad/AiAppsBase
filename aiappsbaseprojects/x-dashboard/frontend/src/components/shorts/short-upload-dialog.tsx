"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { useCreateShort } from "@/hooks/use-shorts";
import { setLocalMediaUrl } from "@/lib/local-media-cache";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ShortUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortUploadDialog({ open, onOpenChange }: ShortUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");

  const createShort = useCreateShort();

  function reset() {
    setFile(null);
    setCaption("");
    setDescription("");
    setHashtags("");
  }

  function handleSubmit() {
    if (!file) {
      toast.error("Choose a video file first.");
      return;
    }
    if (!caption.trim()) {
      toast.error("Caption is required.");
      return;
    }

    const parsedHashtags = hashtags
      .split(/[\s,]+/)
      .map((tag) => tag.replace(/^#/, "").trim())
      .filter(Boolean);

    const objectUrl = URL.createObjectURL(file);

    createShort
      .mutateAsync({
        fileName: file.name,
        caption,
        description,
        hashtags: parsedHashtags,
      })
      .then((created) => {
        setLocalMediaUrl(created.id, objectUrl);
        toast.success("Short uploaded");
        reset();
        onOpenChange(false);
      })
      .catch(() => toast.error("Could not upload short."));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          reset();
        }
        onOpenChange(value);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a short</DialogTitle>
          <DialogDescription>
            Add a vertical video clip with a caption, description, and hashtags.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center text-muted-foreground hover:bg-accent">
            <UploadCloud className="h-6 w-6" />
            <span className="text-sm">
              {file ? file.name : "Click to choose a video file"}
            </span>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <div className="space-y-1.5">
            <Label htmlFor="caption">Caption</Label>
            <Input
              id="caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="A catchy one-liner"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hashtags">Hashtags</Label>
            <Input
              id="hashtags"
              value={hashtags}
              onChange={(event) => setHashtags(event.target.value)}
              placeholder="design, productivity, startup"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createShort.isPending}>
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
