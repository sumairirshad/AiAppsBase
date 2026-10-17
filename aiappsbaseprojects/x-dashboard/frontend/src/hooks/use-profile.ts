import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { profileApi } from "@/lib/api-client";
import type { UpdateProfileRequest } from "@/lib/types";

export const profileQueryKey = ["profile"];

export function useProfile() {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: profileApi.get,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => profileApi.update(payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey, profile);
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}
