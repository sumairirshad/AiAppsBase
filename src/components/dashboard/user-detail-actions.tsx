'use client'

import { useRouter } from 'next/navigation'

import { UserStatusMenu } from '@/components/dashboard/user-status-menu'

export function UserDetailActions({ userId, currentStatus }: { userId: string; currentStatus: string }) {
  const router = useRouter()
  return (
    <UserStatusMenu
      userId={userId}
      currentStatus={currentStatus}
      size="default"
      onUpdated={() => router.refresh()}
    />
  )
}
