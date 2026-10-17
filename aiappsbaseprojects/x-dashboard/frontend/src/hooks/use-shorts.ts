import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { shortsApi } from "@/lib/api-client";
import type { CreateShortRequest } from "@/lib/types";
import { dashboardSummaryQueryKey } from "@/hooks/use-dashboard-summary";

export const shortsQueryKey = ["shorts"];

export function useShorts() {
  return useQuery({
    queryKey: shortsQueryKey,
    queryFn: shortsApi.list,
  });
}

function useInvalidateShorts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: shortsQueryKey });
    queryClient.invalidateQueries({ queryKey: dashboardSummaryQueryKey });
  };
}

export function useCreateShort() {
  const invalidate = useInvalidateShorts();
  return useMutation({
    mutationFn: (payload: CreateShortRequest) => shortsApi.create(payload),
    onSuccess: invalidate,
  });
}

export function useDeleteShort() {
  const invalidate = useInvalidateShorts();
  return useMutation({
    mutationFn: (id: string) => shortsApi.remove(id),
    onSuccess: invalidate,
  });
}
