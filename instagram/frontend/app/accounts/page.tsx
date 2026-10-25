"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { AccountDto } from "@/lib/types";
import { Card, Button, EmptyState, LoadingState, ErrorAlert } from "@/components/ui";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  async function loadAccounts() {
    try {
      setError(null);
      const data = await apiFetch<AccountDto[]>("/api/accounts");
      setAccounts(data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to load accounts.");
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const result = await apiFetch<{ authorizationUrl: string; state: string }>("/api/auth/connect");
      sessionStorage.setItem("ig_oauth_state", result.state);
      window.location.href = result.authorizationUrl;
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to start the connection flow.");
      setConnecting(false);
    }
  }

  async function handleDisconnect(id: string) {
    if (!confirm("Disconnect this account? Scheduled publishing jobs for it will stop processing.")) return;
    try {
      await apiFetch(`/api/accounts/${id}`, { method: "DELETE" });
      await loadAccounts();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to disconnect the account.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Connected Accounts</h1>
        <Button onClick={handleConnect} disabled={connecting}>
          {connecting ? "Redirecting to Instagram..." : "Connect Instagram Account"}
        </Button>
      </div>

      {error && <ErrorAlert message={error} />}

      {accounts === null ? (
        <LoadingState label="Loading accounts..." />
      ) : accounts.length === 0 ? (
        <EmptyState
          title="No accounts connected"
          description="Connect an Instagram professional (Business or Creator) account to start publishing."
        />
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <Card key={account.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">@{account.username}</p>
                <p className="text-sm text-[var(--ig-muted)]">
                  {account.accountType ?? "Unknown type"} · {account.followersCount ?? 0} followers ·{" "}
                  {account.isActive ? "Active" : "Disconnected"}
                </p>
                <p className="text-xs text-[var(--ig-muted)]">
                  Token expires {new Date(account.tokenExpiresAt).toLocaleString()}
                </p>
              </div>
              <Button variant="danger" onClick={() => handleDisconnect(account.id)}>
                Disconnect
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
