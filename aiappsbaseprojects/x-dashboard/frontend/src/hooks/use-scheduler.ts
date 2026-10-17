import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { schedulerApi } from "@/lib/api-client";
import type {
  CreateScheduledPostRequest,
  UpdateScheduledPostRequest,
} from "@/lib/types";
import { dashboardSummaryQueryKey } from "@/hooks/use-dashboard-summary";
import { postsQueryKey } from "@/hooks/use-posts";

export const scheduledPostsQueryKey = ["scheduled-posts"];

export function useScheduledPosts() {
  return useQuery({
    queryKey: scheduledPostsQueryKey,
    queryFn: schedulerApi.list,
  });
}

function useInvalidateScheduled() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: scheduledPostsQueryKey });
    queryClient.invalidateQueries({ queryKey: dashboardSummaryQueryKey });
    queryClient.invalidateQueries({ queryKey: postsQueryKey });
  };
}

export function useCreateScheduledPost() {
  const invalidate = useInvalidateScheduled();
  return useMutation({
    mutationFn: (payload: CreateScheduledPostRequest) =>
      schedulerApi.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateScheduledPost() {
  const invalidate = useInvalidateScheduled();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateScheduledPostRequest;
    }) => schedulerApi.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useCancelScheduledPost() {
  const invalidate = useInvalidateScheduled();
  return useMutation({
    mutationFn: (id: string) => schedulerApi.cancel(id),
    onSuccess: invalidate,
  });
}

export function usePublishScheduledPostNow() {
  const invalidate = useInvalidateScheduled();
  return useMutation({
    mutationFn: (id: string) => schedulerApi.publishNow(id),
    onSuccess: invalidate,
  });
}
