import { backendFetchAnonymous } from "@/lib/backend-client";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

async function getHealth() {
  try {
    return await backendFetchAnonymous<{ status: string; service: string; timestampUtc: string }>("/health");
  } catch {
    return null;
  }
}

export default async function SettingsPage() {
  const health = await getHealth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card>
        <h2 className="font-medium">Backend connectivity</h2>
        {health ? (
          <p className="mt-2 text-sm text-green-700">
            Connected to {health.service} — status {health.status} as of {new Date(health.timestampUtc).toLocaleString()}
          </p>
        ) : (
          <p className="mt-2 text-sm text-red-700">
            Could not reach the Instagram backend. Verify INSTAGRAM_BACKEND_URL in frontend/.env.local and that the backend is running.
          </p>
        )}
      </Card>

      <Card>
        <h2 className="font-medium">Profile and privacy settings</h2>
        <p className="mt-2 text-sm text-[var(--ig-muted)]">
          Bio, profile picture, website, contact info, account privacy, interaction controls, pinned posts and
          highlights cannot be changed through Instagram&apos;s official API. Manage them directly in the Instagram
          app or Meta Business Suite. See the README &quot;Limitations and unsupported features&quot; section.
        </p>
      </Card>
    </div>
  );
}
