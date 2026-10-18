"use client";

import { BadgeCheck, Info } from "lucide-react";

import { usePremiumStatus } from "@/hooks/use-premium-status";
import { ApiErrorState } from "@/components/common/api-error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function PremiumPage() {
  const { data: status, isLoading, isError, error, refetch } = usePremiumStatus();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !status) {
    return <ApiErrorState error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BadgeCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">
                {status.isSubscribed ? `X ${status.tier}` : "Not subscribed"}
              </p>
              {status.hasVerifiedBadge && (
                <Badge className="gap-1">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </Badge>
              )}
            </div>
            {status.verifiedType && (
              <p className="text-sm text-muted-foreground">
                Verification type: {status.verifiedType}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed bg-muted/40">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            X Premium is a manual, paid subscription managed on X itself. This panel is
            read-only and reflects the connected account&apos;s real subscription_type and
            verified_type fields from the X API; it cannot be purchased, cancelled, or changed
            from this dashboard. X does not expose a subscription start date, renewal date, or a
            benefits list over the API, so those are intentionally not shown here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
