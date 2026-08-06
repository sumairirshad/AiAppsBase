'use client'

import { DashboardError } from '@/components/dashboard/error-state'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <DashboardError error={error} reset={reset} />
}
