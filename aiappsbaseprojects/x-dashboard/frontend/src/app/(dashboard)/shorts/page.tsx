"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { useShorts, useDeleteShort } from "@/hooks/use-shorts";
import type { Short } from "@/lib/types";
import { ShortCard } from "@/components/shorts/short-card";
import { ShortUploadDialog } from "@/components/shorts/short-upload-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShortsPage() {
  const { data: shorts, isLoading } = useShorts();
  const deleteShort = useDeleteShort();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [deletingShort, setDeletingShort] = useState<Short | undefined>();

  function handleDeleteConfirmed() {
    if (!deletingShort) {
      return;
    }
    deleteShort.mutate(deletingShort.id, {
      onSuccess: () => {
        toast.success("Short deleted");
        setDeletingShort(undefined);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {shorts?.length ?? 0} shorts
        </p>
        <Button onClick={() => setUploadOpen(true)}>
          <Plus className="h-4 w-4" />
          Upload short
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[9/16] w-full" />
          ))}

        {shorts?.map((short) => (
          <ShortCard key={short.id} short={short} onDelete={setDeletingShort} />
        ))}
      </div>

      {shorts?.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No shorts yet. Upload your first clip.
        </p>
      )}

      <ShortUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />

      <ConfirmDialog
        open={Boolean(deletingShort)}
        onOpenChange={(open) => !open && setDeletingShort(undefined)}
        title="Delete short?"
        description="This action cannot be undone."
        onConfirm={handleDeleteConfirmed}
        isPending={deleteShort.isPending}
      />
    </div>
  );
}
