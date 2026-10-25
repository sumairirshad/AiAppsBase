"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/client-api";
import { StatusBadge } from "@/components/StatusBadge";
import type { PublishingJob } from "@/lib/types";

export default function JobsPage() {
  const [jobs, setJobs] = useState<PublishingJob[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    fetchJson<PublishingJob[]>("/api/proxy/jobs")
      .then(setJobs)
      .catch((err: Error) => setError(err.message));
  };

  useEffect(load, []);

  const retry = async (id: string) => {
    setBusyId(id);
    try {
      await fetchJson(`/api/proxy/jobs/${id}/retry`, { method: "POST" });
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

  if (!jobs) {
    return <p className="text-zinc-400">Loading jobs...</p>;
  }

  if (jobs.length === 0) {
    return <p className="text-zinc-400">No publishing jobs yet. Compose one to get started.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Publishing jobs</h1>
      <ul className="space-y-3">
        {jobs.map((job) => (
          <li key={job.id} className="rounded border border-zinc-800 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{job.title || job.caption.slice(0, 60)}</p>
                <p className="text-sm text-zinc-400">
                  {job.contentType} &middot; {job.mediaAssets.length} media item(s) &middot;{" "}
                  {job.requestDirectPost ? "direct post" : "sent to inbox"}
                </p>
                {job.errorMessage && <p className="mt-1 text-sm text-red-400">{job.errorMessage}</p>}
                {job.publishedPostId && (
                  <p className="mt-1 text-sm text-emerald-400">Published post id: {job.publishedPostId}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={job.status} />
                {job.status === "Failed" && (
                  <button
                    onClick={() => retry(job.id)}
                    disabled={busyId === job.id}
                    className="rounded border border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {busyId === job.id ? "Retrying..." : "Retry"}
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
