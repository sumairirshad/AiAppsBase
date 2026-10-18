import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { connectionApi } from "@/lib/api-client";

export const connectionStatusQueryKey = ["x-connection-status"];

export function useConnectionStatus() {
  return useQuery({
    queryKey: connectionStatusQueryKey,
    queryFn: connectionApi.getStatus,
    // Poll gently so the UI notices a connect/disconnect that happened via the OAuth redirect
    // (a full page navigation) without requiring a manual refresh.
    refetchInterval: 30_000,
  });
}

export function useDisconnectX() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => connectionApi.logout(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectionStatusQueryKey });
      queryClient.invalidateQueries();
    },
  });
}
