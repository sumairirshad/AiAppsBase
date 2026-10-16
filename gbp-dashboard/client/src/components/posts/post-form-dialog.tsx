"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PostForm } from "@/components/posts/post-form";
import { PostDraft } from "@/types/post";

interface PostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialDraft?: PostDraft;
  onSubmit: (draft: PostDraft) => Promise<void>;
  submitLabel: string;
}

export function PostFormDialog({
  open,
  onOpenChange,
  title,
  initialDraft,
  onSubmit,
  submitLabel,
}: PostFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <PostForm
          key={initialDraft ? JSON.stringify(initialDraft) : "new"}
          initialDraft={initialDraft}
          submitLabel={submitLabel}
          onCancel={() => onOpenChange(false)}
          onSubmit={async (draft) => {
            await onSubmit(draft);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
