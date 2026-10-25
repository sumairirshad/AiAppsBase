"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchJson } from "@/lib/client-api";
import type { ConnectedAccount } from "@/lib/types";

function CallbackBanner() {
  const params = useSearchParams();
  const status = params.get("status");
  const reason = params.get("reason");

  if (!status) {
    return null;
  }

  if (status === "success") {
    return (
      <div className="rounded border border-emerald-800 bg-emerald-950 p-4 text-emerald-200">
        Account connected successfully.
      </div>
    );
  }

  return (
    <div className="rounded border border-red-800 bg-red-950 p-4 text-red-200">
      Connection failed: {reason ?? "Unknown error."}
    </div>
  );
}

function AccountsList() {
  const [accounts, setAccounts] = useState<ConnectedAccount[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    fetchJson<ConnectedAccount[]>("/api/proxy/accounts")
      .then(setAccounts)
      .catch((err: Error) => setError(err.message));
  };

  useEffect(load, []);

  const disconnect = async (id: string) => {
    setBusyId(id);
    try {
      await fetchJson(`/api/proxy/accounts/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (!accounts) {
    return <p className="text-zinc-400">Loading accounts...</p>;
  }

  if (accounts.length === 0) {
    return <p className="text-zinc-400">No accounts connected yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {accounts.map((account) => (
        <li key={account.id} className="flex items-center justify-between rounded border border-zinc-800 p-4">
          <div>
            <p className="font-medium">
              @{account.username} {account.isActive ? "" : "(disconnected)"}
            </p>
            <p className="text-sm text-zinc-400">Scopes: {account.grantedScopes}</p>
            <p className="text-sm text-zinc-400">
              Access token expires {new Date(account.accessTokenExpiresAt).toLocaleString()}
            </p>
          </div>
          {account.isActive && (
            <button
              onClick={() => disconnect(account.id)}
              disabled={busyId === account.id}
              className="rounded border border-red-700 px-3 py-1 text-sm text-red-300 hover:bg-red-950 disabled:opacity-50"
            >
              {busyId === account.id ? "Disconnecting..." : "Disconnect"}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function ConnectPage() {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const result = await fetchJson<{ authorizationUrl: string }>("/api/proxy/accounts/connect");
      window.location.href = result.authorizationUrl;
    } catch (err) {
      setError((err as Error).message);
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold">Connect a TikTok account</h1>
        <p className="mt-1 text-zinc-400">
          You will be redirected to TikTok to sign in and grant access. TikTok requires the app owner to add your
          account as a sandbox test user, or to pass app audit, before this works outside of development. See the
          README&apos;s developer setup section.
        </p>
      </section>

      <Suspense fallback={null}>
        <CallbackBanner />
      </Suspense>

      <button
        onClick={startConnect}
        disabled={connecting}
        className="rounded bg-zinc-100 px-4 py-2 font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
      >
        {connecting ? "Redirecting..." : "Connect TikTok Account"}
      </button>

      {error && <p className="text-red-400">{error}</p>}

      <section>
        <h2 className="text-lg font-semibold">Connected accounts</h2>
        <div className="mt-3">
          <AccountsList />
        </div>
      </section>
    </div>
  );
}
