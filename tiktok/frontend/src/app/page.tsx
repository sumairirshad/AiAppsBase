"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchJson } from "@/lib/client-api";
import type { ConnectedAccount, PublishingJob } from "@/lib/types";

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<ConnectedAccount[] | null>(null);
  const [jobs, setJobs] = useState<PublishingJob[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchJson<ConnectedAccount[]>("/api/proxy/accounts"), fetchJson<PublishingJob[]>("/api/proxy/jobs")])
      .then(([accountsResult, jobsResult]) => {
        setAccounts(accountsResult);
        setJobs(jobsResult);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return <p className="text-red-400">Failed to load dashboard: {error}</p>;
  }

  if (!accounts || !jobs) {
    return <p className="text-zinc-400">Loading dashboard...</p>;
  }

  const activeAccounts = accounts.filter((a) => a.isActive);
  const failedJobs = jobs.filter((j) => j.status === "Failed").length;
  const inFlightJobs = jobs.filter((j) => j.status === "Pending" || j.status === "Processing").length;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-zinc-400">
          {activeAccounts.length} connected account{activeAccounts.length === 1 ? "" : "s"} &middot; {inFlightJobs} job(s)
          in flight &middot; {failedJobs} failed
        </p>
      </section>

      {activeAccounts.length === 0 ? (
        <div className="rounded border border-dashed border-zinc-700 p-6 text-center text-zinc-400">
          No TikTok account connected yet.{" "}
          <Link href="/connect" className="text-blue-400 underline">
            Connect one now
          </Link>
          .
        </div>
      ) : (
        <ul className="space-y-3">
          {activeAccounts.map((account) => (
            <li key={account.id} className="flex items-center justify-between rounded border border-zinc-800 p-4">
              <div>
                <p className="font-medium">@{account.username}</p>
                <p className="text-sm text-zinc-400">
                  {account.followerCount.toLocaleString()} followers &middot; {account.videoCount.toLocaleString()} videos
                </p>
              </div>
              <Link href="/compose" className="text-sm text-blue-400 underline">
                Publish content
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
