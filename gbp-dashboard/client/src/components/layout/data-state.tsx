import { AlertTriangle } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

interface DataStateProps {
  isLoading: boolean;
  error: Error | null;
  loadingFallback?: React.ReactNode;
  children: React.ReactNode;
}

export function DataState({
  isLoading,
  error,
  loadingFallback,
  children,
}: DataStateProps) {
  if (isLoading) {
    return (
      loadingFallback ?? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        <AlertTriangle className="size-4" />
        <span>
          Could not reach the backend API. Make sure it is running and try
          again.
        </span>
      </div>
    );
  }

  return <>{children}</>;
}
