import { useQuery } from "@tanstack/react-query";

import { premiumApi } from "@/lib/api-client";

export const premiumStatusQueryKey = ["premium-status"];

export function usePremiumStatus() {
  return useQuery({
    queryKey: premiumStatusQueryKey,
    queryFn: premiumApi.getStatus,
  });
}
