import { useQuery } from "@tanstack/react-query";

import { dashboardApi } from "@/lib/api-client";

export const dashboardSummaryQueryKey = ["dashboard-summary"];

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardSummaryQueryKey,
    queryFn: dashboardApi.getSummary,
  });
}
