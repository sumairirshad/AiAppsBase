"use client";

import { AlertTriangle, Link2, RefreshCcw } from "lucide-react";

import { ApiError, connectionApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ApiErrorStateProps {
  error: unknown;
  onRetry?: () => void;
}

/// Renders the real error X (or this backend) returned instead of a generic failure message,
/// with a specific call to action for the two cases that aren't "just retry": not connected yet,
/// and rate limited.
export function ApiErrorState({ error, onRetry }: ApiErrorStateProps) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  const code = error instanceof ApiError ? error.code : undefined;

  if (code === "not_connected") {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <Link2 className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">Connect your X account</p>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Button asChild>
            <a href={connectionApi.loginUrl()}>Connect to X</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (code === "rate_limited") {
    const retryAfter = error instanceof ApiError ? error.retryAfterSeconds : null;
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          <p className="text-sm font-medium">X API rate limit reached</p>
          <p className="text-sm text-muted-foreground">
            {message}
            {retryAfter ? ` Try again in about ${retryAfter}s.` : ""}
          </p>
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <p className="text-sm font-medium">Couldn&apos;t load this from X</p>
        <p className="text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
