import Link from "next/link";
import { backendFetch, backendFetchAnonymous } from "@/lib/backend-client";
import { AccountDto, PublishingJobDto } from "@/lib/types";
import { Card, Badge, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

async function loadDashboardData() {
  const [health, accounts, jobs] = await Promise.allSettled([
    backendFetchAnonymous<{ status: string }>("/health"),
    backendFetch<AccountDto[]>("/api/accounts"),
    backendFetch<PublishingJobDto[]>("/api/publishing/jobs")
  ]);

  return {
    backendHealthy: health.status === "fulfilled" && health.value.status === "healthy",
    accounts: accounts.status === "fulfilled" ? accounts.value : [],
    jobs: jobs.status === "fulfilled" ? jobs.value : []
  };
}

export default async function DashboardPage() {
  const { backendHealthy, accounts, jobs } = await loadDashboardData();
  const activeAccounts = accounts.filter((a) => a.isActive);
  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-[var(--ig-muted)]">
          Backend status: {backendHealthy ? "Online" : "Unreachable — check INSTAGRAM_BACKEND_URL and that the API is running."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-[var(--ig-muted)]">Connected accounts</p>
          <p className="text-3xl font-semibold">{activeAccounts.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--ig-muted)]">Publishing jobs</p>
          <p className="text-3xl font-semibold">{jobs.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--ig-muted)]">Failed jobs</p>
          <p className="text-3xl font-semibold">{jobs.filter((j) => j.status === "Failed").length}</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-medium">Recent publishing jobs</h2>
        {recentJobs.length === 0 ? (
          <EmptyState title="No jobs yet" description="Create your first post from the Compose page." />
        ) : (
          <ul className="divide-y divide-[var(--ig-border)]">
            {recentJobs.map((job) => (
              <li key={job.id} className="flex items-center justify-between py-2 text-sm">
                <span>{job.contentType} — {job.caption?.slice(0, 60) || "(no caption)"}</span>
                <Badge status={job.status} />
              </li>
            ))}
          </ul>
        )}
        <Link href="/jobs" className="mt-3 inline-block text-sm text-[var(--ig-accent)]">
          View all jobs →
        </Link>
      </Card>

      {activeAccounts.length === 0 && (
        <Card>
          <p className="text-sm">
            No Instagram account is connected yet.{" "}
            <Link href="/accounts" className="text-[var(--ig-accent)]">Connect one now</Link>.
          </p>
        </Card>
      )}
    </div>
  );
}
