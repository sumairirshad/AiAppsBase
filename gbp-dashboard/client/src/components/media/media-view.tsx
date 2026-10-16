"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { AddMediaDialog } from "@/components/media/add-media-dialog";
import { MediaGrid } from "@/components/media/media-grid";
import { DataState } from "@/components/layout/data-state";
import { Button } from "@/components/ui/button";
import { useAsyncData } from "@/hooks/use-async-data";
import { deleteMediaItem, getMediaItems } from "@/lib/data/media";
import { MediaItem } from "@/types/media";

export function MediaView() {
  const { data: items, isLoading, error, reload } = useAsyncData(getMediaItems);
  const [isAddOpen, setIsAddOpen] = useState(false);

  async function handleDelete(item: MediaItem) {
    await deleteMediaItem(item.id);
    toast.success("Media removed");
    reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage the photos and videos shown on your business profile.
        </p>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="size-4" />
          Add media
        </Button>
      </div>

      <DataState isLoading={isLoading} error={error}>
        {items && <MediaGrid items={items} onDelete={handleDelete} />}
      </DataState>

      <AddMediaDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onAdded={reload}
      />
    </div>
  );
}
