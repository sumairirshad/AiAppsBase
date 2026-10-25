"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { AccountDto, MetricDto } from "@/lib/types";
import { Card, Button, EmptyState, LoadingState, ErrorAlert } from "@/components/ui";

export default function InsightsPage() {
  const [accounts, setAccounts] = useState<AccountDto[] | null>(null);
  const [accountId, setAccountId] = useState("");
  const [metrics, setMetrics] = useState<MetricDto[] | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AccountDto[]>("/api/accounts").then((data) => {
      const active = data.filter((a) => a.isActive);
      setAccounts(active);
      if (active[0]) setAccountId(active[0].id);
    });
  }, []);

  async function handleSync() {
    if (!accountId) return;
    setSyncing(true);
    setError(null);
    try {
      const data = await apiFetch<MetricDto[]>(`/api/insights/accounts/${accountId}/sync`, { method: "POST" });
      setMetrics(data);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Unable to sync insights. Insights require instagram_business_manage_insights permission and App Review approval."
      );
    } finally {
      setSyncing(false);
    }
  }

  if (accounts === null) return <LoadingState label="Loading accounts..." />;
  if (accounts.length === 0) {
    return <EmptyState title="No connected accounts" description="Connect an account first to view insights." />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Insights</h1>

      <Card className="flex items-center gap-4">
        <select
          className="rounded-md border border-[var(--ig-border)] p-2 text-sm"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>@{a.username}</option>
          ))}
        </select>
        <Button onClick={handleSync} disabled={syncing}>
          {syncing ? "Syncing..." : "Sync Account Insights"}
        </Button>
      </Card>

      {error && <ErrorAlert message={error} />}

      {metrics && (
        <div className="grid gap-4 sm:grid-cols-3">
          {metrics.map((metric) => (
            <Card key={metric.name}>
              <p className="text-sm text-[var(--ig-muted)]">{metric.name}</p>
              <p className="text-2xl font-semibold">{metric.value.toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
