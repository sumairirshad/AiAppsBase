"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { AccountDto, InstagramContentType, InstagramMediaKind } from "@/lib/types";
import { Card, Button, ErrorAlert, LoadingState } from "@/components/ui";

interface AssetRow {
  url: string;
  mediaKind: InstagramMediaKind;
}

const CONTENT_TYPES: InstagramContentType[] = ["Image", "Carousel", "Reels", "Story"];

export default function ComposePage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountDto[] | null>(null);
  const [accountId, setAccountId] = useState("");
  const [contentType, setContentType] = useState<InstagramContentType>("Image");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [assets, setAssets] = useState<AssetRow[]>([{ url: "", mediaKind: "Image" }]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AccountDto[]>("/api/accounts").then((data) => {
      setAccounts(data);
      const active = data.find((a) => a.isActive);
      if (active) setAccountId(active.id);
    });
  }, []);

  function updateAsset(index: number, patch: Partial<AssetRow>) {
    setAssets((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }

  function addAsset() {
    setAssets((prev) => [...prev, { url: "", mediaKind: "Image" }]);
  }

  function removeAsset(index: number) {
    setAssets((prev) => prev.filter((_, i) => i !== index));
  }

  useEffect(() => {
    if (contentType !== "Carousel" && assets.length > 1) {
      setAssets((prev) => [prev[0]]);
    }
  }, [contentType, assets.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!accountId) {
      setError("Select a connected account first.");
      return;
    }
    if (assets.some((a) => !a.url.trim())) {
      setError("Every media asset needs a publicly accessible URL.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          connectedAccountId: accountId,
          contentType,
          caption: caption || null,
          hashtags: hashtags || null,
          mediaAssets: assets.map((a) => ({ url: a.url, mediaKind: a.mediaKind })),
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null
        })
      });
      router.push("/jobs");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to create the publishing job.");
    } finally {
      setSubmitting(false);
    }
  }

  if (accounts === null) return <LoadingState label="Loading accounts..." />;

  const activeAccounts = accounts.filter((a) => a.isActive);
  if (activeAccounts.length === 0) {
    return <ErrorAlert message="Connect an Instagram account on the Accounts page before composing a post." />;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Compose</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorAlert message={error} />}

          <div>
            <label className="block text-sm font-medium">Account</label>
            <select
              className="mt-1 w-full rounded-md border border-[var(--ig-border)] p-2"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>@{a.username}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Content type</label>
            <select
              className="mt-1 w-full rounded-md border border-[var(--ig-border)] p-2"
              value={contentType}
              onChange={(e) => setContentType(e.target.value as InstagramContentType)}
            >
              {CONTENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Media {contentType === "Carousel" ? "(2-10 assets)" : "(1 asset)"}</label>
            <div className="mt-1 space-y-2">
              {assets.map((asset, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    className="flex-1 rounded-md border border-[var(--ig-border)] p-2 text-sm"
                    placeholder="https://your-cdn.com/media.jpg"
                    value={asset.url}
                    onChange={(e) => updateAsset(index, { url: e.target.value })}
                  />
                  <select
                    className="rounded-md border border-[var(--ig-border)] p-2 text-sm"
                    value={asset.mediaKind}
                    onChange={(e) => updateAsset(index, { mediaKind: e.target.value as InstagramMediaKind })}
                  >
                    <option value="Image">Image</option>
                    <option value="Video">Video</option>
                  </select>
                  {contentType === "Carousel" && assets.length > 1 && (
                    <Button type="button" variant="secondary" onClick={() => removeAsset(index)}>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              {contentType === "Carousel" && assets.length < 10 && (
                <Button type="button" variant="secondary" onClick={addAsset}>
                  Add media
                </Button>
              )}
            </div>
            <p className="mt-1 text-xs text-[var(--ig-muted)]">
              Media must be hosted at a publicly reachable HTTPS URL — Instagram fetches it directly.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">Caption</label>
            <textarea
              className="mt-1 w-full rounded-md border border-[var(--ig-border)] p-2 text-sm"
              rows={4}
              maxLength={2200}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Hashtags (reference only, not sent separately to the API)</label>
            <input
              className="mt-1 w-full rounded-md border border-[var(--ig-border)] p-2 text-sm"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#brand #launch"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Schedule for later (optional)</label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-md border border-[var(--ig-border)] p-2 text-sm"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : scheduledAt ? "Schedule Post" : "Publish Now"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
