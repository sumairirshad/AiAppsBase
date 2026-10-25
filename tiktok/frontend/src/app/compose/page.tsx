"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson } from "@/lib/client-api";
import type { ConnectedAccount, CreateJobPayload, PublishingJob } from "@/lib/types";

export default function ComposePage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<ConnectedAccount[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [accountId, setAccountId] = useState("");
  const [contentType, setContentType] = useState<"Video" | "PhotoPost">("Video");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [mediaUrlsText, setMediaUrlsText] = useState("");
  const [visibility, setVisibility] = useState("SelfOnly");
  const [requestDirectPost, setRequestDirectPost] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");

  useEffect(() => {
    fetchJson<ConnectedAccount[]>("/api/proxy/accounts")
      .then((result) => {
        const active = result.filter((a) => a.isActive);
        setAccounts(active);
        if (active.length > 0) {
          setAccountId(active[0].id);
        }
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const mediaUrls = mediaUrlsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const canSubmit =
    accountId.length > 0 && caption.trim().length > 0 && mediaUrls.length > 0 && !submitting;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload: CreateJobPayload = {
        connectedAccountId: accountId,
        contentType,
        title: title || undefined,
        caption,
        hashtags: hashtags || undefined,
        mediaUrls,
        requestedVisibility: visibility,
        requestDirectPost,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined
      };

      await fetchJson<PublishingJob>("/api/proxy/jobs", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      router.push("/jobs");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!accounts) {
    return <p className="text-zinc-400">Loading accounts...</p>;
  }

  if (accounts.length === 0) {
    return <p className="text-zinc-400">Connect a TikTok account before composing content.</p>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Compose a TikTok post</h1>

      <div className="space-y-4">
        <label className="block">
          <span className="text-sm text-zinc-400">Account</span>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 p-2"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                @{a.username}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-zinc-400">Content type</span>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as "Video" | "PhotoPost")}
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 p-2"
          >
            <option value="Video">Video</option>
            <option value="PhotoPost">Photo post (carousel)</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-zinc-400">Title (optional)</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 p-2"
          />
        </label>

        <label className="block">
          <span className="text-sm text-zinc-400">Caption</span>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={2200}
            rows={4}
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 p-2"
          />
        </label>

        <label className="block">
          <span className="text-sm text-zinc-400">Hashtags (optional)</span>
          <input
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#tisoroglobal #investmentmigration"
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 p-2"
          />
        </label>

        <label className="block">
          <span className="text-sm text-zinc-400">
            {contentType === "Video" ? "Video URL" : "Photo URLs (one per line)"}
          </span>
          <textarea
            value={mediaUrlsText}
            onChange={(e) => setMediaUrlsText(e.target.value)}
            rows={contentType === "Video" ? 1 : 4}
            placeholder="https://example.com/media.mp4"
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 p-2"
          />
          <span className="text-xs text-zinc-500">
            Media must be reachable at a public HTTPS URL; TikTok pulls it directly from this URL.
          </span>
        </label>

        <label className="block">
          <span className="text-sm text-zinc-400">Visibility requested</span>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 p-2"
          >
            <option value="SelfOnly">Only me (required until the app passes TikTok audit)</option>
            <option value="PublicToEveryone">Public</option>
            <option value="MutualFollowFriends">Mutual followers</option>
            <option value="FollowerOfCreator">Followers</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={requestDirectPost} onChange={(e) => setRequestDirectPost(e.target.checked)} />
          <span className="text-sm text-zinc-400">
            Direct post (if unchecked, content is sent to the creator&apos;s TikTok inbox as a draft instead of
            publishing automatically)
          </span>
        </label>

        <label className="block">
          <span className="text-sm text-zinc-400">Schedule for later (optional)</span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 p-2"
          />
        </label>
      </div>

      {error && <p className="text-red-400">{error}</p>}

      <button
        onClick={submit}
        disabled={!canSubmit}
        className="rounded bg-zinc-100 px-4 py-2 font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
      >
        {submitting ? "Submitting..." : scheduledAt ? "Schedule post" : "Publish now"}
      </button>
    </div>
  );
}
