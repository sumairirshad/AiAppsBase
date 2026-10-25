const colors: Record<string, string> = {
  Draft: "bg-zinc-700 text-zinc-200",
  Pending: "bg-amber-900 text-amber-200",
  Processing: "bg-blue-900 text-blue-200",
  PublishedDirect: "bg-emerald-900 text-emerald-200",
  SentToInbox: "bg-indigo-900 text-indigo-200",
  Failed: "bg-red-900 text-red-200"
};

export function StatusBadge({ status }: { status: string }) {
  const classes = colors[status] ?? "bg-zinc-700 text-zinc-200";
  return <span className={`rounded px-2 py-1 text-xs font-medium ${classes}`}>{status}</span>;
}
