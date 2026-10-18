import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { postsApi } from "@/lib/api-client";
import type { CreatePostRequest } from "@/lib/types";
import { dashboardSummaryQueryKey } from "@/hooks/use-dashboard-summary";

export const postsQueryKey = ["posts"];

export function usePosts() {
  return useQuery({
    queryKey: postsQueryKey,
    queryFn: postsApi.list,
  });
}

function useInvalidatePosts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: postsQueryKey });
    queryClient.invalidateQueries({ queryKey: dashboardSummaryQueryKey });
  };
}

export function useCreatePost() {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: (payload: CreatePostRequest) => postsApi.create(payload),
    onSuccess: invalidate,
  });
}

export function useDeletePost() {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: (id: string) => postsApi.remove(id),
    onSuccess: invalidate,
  });
}

export function usePinPost() {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: (id: string) => postsApi.pin(id),
    onSuccess: invalidate,
  });
}
