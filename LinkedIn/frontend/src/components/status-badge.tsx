import type { PostStatus } from '@/lib/types'

const COLORS: Record<PostStatus, string> = {
  Draft: 'bg-slate-100 text-slate-700',
  Scheduled: 'bg-amber-100 text-amber-800',
  Publishing: 'bg-sky-100 text-sky-800',
  Published: 'bg-emerald-100 text-emerald-800',
  Failed: 'bg-red-100 text-red-800',
}

export function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[status]}`}>
      {status}
    </span>
  )
}
