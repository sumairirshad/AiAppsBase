"use client";

import { BusinessProfileForm } from "@/components/profile/business-profile-form";
import { DataState } from "@/components/layout/data-state";
import { useAsyncData } from "@/hooks/use-async-data";
import { getBusinessProfile } from "@/lib/data/business-profile";

export function BusinessProfileView() {
  const { data, isLoading, error } = useAsyncData(getBusinessProfile);

  return (
    <DataState isLoading={isLoading} error={error}>
      {data && <BusinessProfileForm profile={data} />}
    </DataState>
  );
}
