"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { PublishingJobDto, PublishingJobStatus } from "@/lib/types";
import { Card, Badge, Button, EmptyState, LoadingState, ErrorAlert } from "@/components/ui";

const STATUS_FILTERS: (PublishingJobStatus | "All")[] = ["All", "Pending", "Processing", "Published", "Failed"];

export default function JobsPage() {
  const [jobs, setJobs] = useState<PublishingJobDto[] | null>(null);
  const [filter, setFilter] = useState<PublishingJobStatus | "All">("All");
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      setError(null);
      const query = filter === "All" ? "" : `?status=${filter}`;
      const data = await apiFetch<PublishingJobDto[]>(`/api/jobs${query}`);
      setJobs(data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to load jobs.");
    }
  }, [filter]);

  useEffect(() => {
    setJobs(null);
    loadJobs();
  }, [loadJobs]);

  async function handleRetry(id: string) {
    setRetryingId(id);
    try {
      await apiFetch(`/api/jobs/${id}/retry`, { method: "POST" });
      await loadJobs();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to retry the job.");
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Publishing Jobs</h1>

      <div className="flex gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === status ? "bg-[var(--ig-accent)] text-white" : "border border-[var(--ig-border)]"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {error && <ErrorAlert message={error} />}

      {jobs === null ? (
        <LoadingState />
      ) : jobs.length === 0 ? (
        <EmptyState title="No jobs found" description="Jobs you create from Compose will appear here." />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{job.contentType}</span>
                    <Badge status={job.status} />
                  </div>
                  <p className="mt-1 text-sm text-[var(--ig-muted)]">{job.caption || "(no caption)"}</p>
                  <p className="mt-1 text-xs text-[var(--ig-muted)]">
                    {job.mediaAssets.length} asset(s) · attempt {job.attemptCount} ·{" "}
                    {job.scheduledAt ? `scheduled for ${new Date(job.scheduledAt).toLocaleString()}` : "published immediately"}
                  </p>
                  {job.errorMessage && <p className="mt-1 text-sm text-red-700">{job.errorMessage}</p>}
                  {job.platformMediaId && (
                    <p className="mt-1 text-xs text-[var(--ig-muted)]">Instagram media ID: {job.platformMediaId}</p>
                  )}
                </div>
                {job.status === "Failed" && (
                  <Button variant="secondary" disabled={retryingId === job.id} onClick={() => handleRetry(job.id)}>
                    {retryingId === job.id ? "Retrying..." : "Retry"}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
