"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/client-api";

interface HealthResponse {
  status: string;
  service?: string;
  timeUtc?: string;
}

export default function SettingsPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<HealthResponse>("/api/proxy/health")
      .then(setHealth)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings &amp; health</h1>

      <section className="rounded border border-zinc-800 p-4">
        <h2 className="font-medium">Backend connectivity</h2>
        {error && <p className="mt-2 text-red-400">Backend unreachable: {error}</p>}
        {health && !error && (
          <div className="mt-2 text-sm text-zinc-300">
            <p>Status: {health.status}</p>
            {health.service && <p>Service: {health.service}</p>}
            {health.timeUtc && <p>Server time: {new Date(health.timeUtc).toLocaleString()}</p>}
          </div>
        )}
      </section>

      <section className="rounded border border-zinc-800 p-4 text-sm text-zinc-300">
        <h2 className="font-medium">About this tool</h2>
        <p className="mt-2">
          This is a single-operator internal console. Profile fields such as bio, avatar, and username cannot be
          edited here because TikTok&apos;s public API does not expose write access to them; manage those directly in
          the TikTok app. See the project README for the full list of supported vs. manual-only workflows.
        </p>
      </section>
    </div>
  );
}
