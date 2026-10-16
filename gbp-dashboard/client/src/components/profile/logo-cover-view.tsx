"use client";

import { ImageUploadCard } from "@/components/profile/image-upload-card";
import { DataState } from "@/components/layout/data-state";
import { useAsyncData } from "@/hooks/use-async-data";
import { getBusinessProfile, updateLogoCover } from "@/lib/data/business-profile";

export function LogoCoverView() {
  const { data, isLoading, error, reload } = useAsyncData(getBusinessProfile);

  return (
    <DataState isLoading={isLoading} error={error}>
      {data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ImageUploadCard
            title="Logo"
            description="Shown on your profile card, posts, and search results."
            imageUrl={data.logoUrl}
            aspectClassName="aspect-square max-w-xs"
            onUpload={async (dataUrl) => {
              await updateLogoCover({ logoUrl: dataUrl });
              reload();
            }}
          />
          <ImageUploadCard
            title="Cover photo"
            description="The wide banner image shown at the top of your profile."
            imageUrl={data.coverPhotoUrl}
            aspectClassName="aspect-video"
            onUpload={async (dataUrl) => {
              await updateLogoCover({ coverPhotoUrl: dataUrl });
              reload();
            }}
          />
        </div>
      )}
    </DataState>
  );
}
