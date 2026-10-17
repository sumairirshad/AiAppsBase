"use client";

import { BadgeCheck, CalendarDays, CheckCircle2, Info } from "lucide-react";

import { usePremiumStatus } from "@/hooks/use-premium-status";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function PremiumPage() {
  const { data: status, isLoading } = usePremiumStatus();

  if (isLoading || !status) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BadgeCheck className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">
                  {status.isSubscribed ? status.tier : "Not subscribed"}
                </p>
                {status.hasVerifiedBadge && (
                  <Badge className="gap-1">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </Badge>
                )}
              </div>
              {status.isSubscribed && status.subscribedSince && (
                <p className="text-sm text-muted-foreground">
                  Member since {formatDate(status.subscribedSince)}
                </p>
              )}
            </div>
          </div>

          {status.renewsOn && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              Renews {formatDate(status.renewsOn)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {status.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {benefit}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-dashed bg-muted/40">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            X Premium is a manual, paid subscription managed on X itself. This panel
            is read-only and reflects status only; it cannot be purchased, cancelled,
            or changed from this dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
