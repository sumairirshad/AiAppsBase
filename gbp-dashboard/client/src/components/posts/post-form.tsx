"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fromDateTimeInputValue, toDateTimeInputValue } from "@/lib/datetime-input";
import { PostDraft, PostType } from "@/types/post";

function createEmptyDraft(): PostDraft {
  return {
    type: "Update",
    status: "Draft",
    title: "",
    body: "",
    imageUrl: "",
    actionButtonLabel: "",
    actionButtonUrl: "",
    eventStartAt: null,
    eventEndAt: null,
    offerCode: "",
    offerValidUntil: null,
    scheduledAt: null,
    publishedAt: null,
  };
}

interface PostFormProps {
  initialDraft?: PostDraft;
  onSubmit: (draft: PostDraft) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}

export function PostForm({
  initialDraft,
  onSubmit,
  onCancel,
  submitLabel,
}: PostFormProps) {
  const [draft, setDraft] = useState<PostDraft>(
    initialDraft ?? createEmptyDraft()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof PostDraft>(field: K, value: PostDraft[K]) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(draft);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Post type</Label>
          <Select
            value={draft.type}
            onValueChange={(value) => updateField("type", value as PostType)}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Update">Update</SelectItem>
              <SelectItem value="Event">Event</SelectItem>
              <SelectItem value="Offer">Offer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            value={draft.imageUrl}
            onChange={(event) => updateField("imageUrl", event.target.value)}
            placeholder="/mock-assets/post-example.svg"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          required
          value={draft.title}
          onChange={(event) => updateField("title", event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="body">Body</Label>
        <Textarea
          id="body"
          rows={4}
          required
          value={draft.body}
          onChange={(event) => updateField("body", event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="actionButtonLabel">Action button label</Label>
          <Input
            id="actionButtonLabel"
            value={draft.actionButtonLabel}
            onChange={(event) =>
              updateField("actionButtonLabel", event.target.value)
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="actionButtonUrl">Action button URL</Label>
          <Input
            id="actionButtonUrl"
            value={draft.actionButtonUrl}
            onChange={(event) =>
              updateField("actionButtonUrl", event.target.value)
            }
          />
        </div>
      </div>

      {draft.type === "Event" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="eventStartAt">Event starts</Label>
            <Input
              id="eventStartAt"
              type="datetime-local"
              value={toDateTimeInputValue(draft.eventStartAt)}
              onChange={(event) =>
                updateField(
                  "eventStartAt",
                  fromDateTimeInputValue(event.target.value)
                )
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="eventEndAt">Event ends</Label>
            <Input
              id="eventEndAt"
              type="datetime-local"
              value={toDateTimeInputValue(draft.eventEndAt)}
              onChange={(event) =>
                updateField(
                  "eventEndAt",
                  fromDateTimeInputValue(event.target.value)
                )
              }
            />
          </div>
        </div>
      )}

      {draft.type === "Offer" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="offerCode">Offer code</Label>
            <Input
              id="offerCode"
              value={draft.offerCode}
              onChange={(event) => updateField("offerCode", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="offerValidUntil">Valid until</Label>
            <Input
              id="offerValidUntil"
              type="datetime-local"
              value={toDateTimeInputValue(draft.offerValidUntil)}
              onChange={(event) =>
                updateField(
                  "offerValidUntil",
                  fromDateTimeInputValue(event.target.value)
                )
              }
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
