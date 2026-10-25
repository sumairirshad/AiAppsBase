"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/client-api";
import type { ConnectedAccount, VideoStat } from "@/lib/types";

export default function StatsPage() {
  const [accounts, setAccounts] = useState<ConnectedAccount[] | null>(null);
  const [selected, setSelected] = useState("");
  const [stats, setStats] = useState<VideoStat[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    fetchJson<ConnectedAccount[]>("/api/proxy/accounts")
      .then((result) => {
        const active = result.filter((a) => a.isActive);
        setAccounts(active);
        if (active.length > 0) {
          setSelected(active[0].id);
        }
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const loadStats = async (accountId: string) => {
    setLoadingStats(true);
    setError(null);
    try {
      const result = await fetchJson<VideoStat[]>(`/api/proxy/stats/${accountId}`);
      setStats(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingStats(false);
    }
  };

  if (!accounts) {
    return <p className="text-zinc-400">Loading accounts...</p>;
  }

  if (accounts.length === 0) {
    return <p className="text-zinc-400">Connect a TikTok account to view stats.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Video stats</h1>

      <div className="flex items-end gap-3">
        <label className="block">
          <span className="text-sm text-zinc-400">Account</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="mt-1 rounded border border-zinc-700 bg-zinc-900 p-2"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                @{a.username}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => loadStats(selected)}
          disabled={loadingStats}
          className="rounded bg-zinc-100 px-4 py-2 font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
        >
          {loadingStats ? "Refreshing..." : "Refresh stats"}
        </button>
      </div>

      {error && <p className="text-red-400">{error}</p>}

      {stats && (
        <table className="w-full text-left text-sm">
          <thead className="text-zinc-400">
            <tr>
              <th className="pb-2">Title</th>
              <th className="pb-2">Views</th>
              <th className="pb-2">Likes</th>
              <th className="pb-2">Comments</th>
              <th className="pb-2">Shares</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((video) => (
              <tr key={video.tikTokVideoId} className="border-t border-zinc-800">
                <td className="py-2">{video.title || video.tikTokVideoId}</td>
                <td className="py-2">{video.viewCount.toLocaleString()}</td>
                <td className="py-2">{video.likeCount.toLocaleString()}</td>
                <td className="py-2">{video.commentCount.toLocaleString()}</td>
                <td className="py-2">{video.shareCount.toLocaleString()}</td>
              </tr>
            ))}
            {stats.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-zinc-500">
                  No videos found for this account yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
