"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addMediaItem } from "@/lib/data/media";
import { readFileAsDataUrl } from "@/lib/read-file-as-data-url";
import { MediaCategory, MediaType } from "@/types/media";

const CATEGORIES: MediaCategory[] = [
  "Interior",
  "Exterior",
  "Product",
  "Team",
  "Food",
  "Other",
];

interface AddMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

export function AddMediaDialog({ open, onOpenChange, onAdded }: AddMediaDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<MediaCategory>("Other");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setFile(null);
    setCaption("");
    setCategory("Other");
  }

  async function handleAdd() {
    if (!file) {
      toast.error("Choose a photo or video to upload");
      return;
    }

    setIsSubmitting(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const type: MediaType = file.type.startsWith("video") ? "Video" : "Photo";
      await addMediaItem({
        type,
        category,
        url: dataUrl,
        thumbnailUrl: dataUrl,
        caption: caption || file.name,
      });
      toast.success("Media added");
      onAdded();
      onOpenChange(false);
      resetForm();
    } catch {
      toast.error("Could not add media");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add media</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="media-file">Photo or video</Label>
            <Input
              id="media-file"
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="caption">Caption</Label>
            <Input
              id="caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Describe this media"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as MediaCategory)}
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add media"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
