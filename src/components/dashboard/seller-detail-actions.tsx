'use client'

import { useRouter } from 'next/navigation'

import { SellerStatusMenu } from '@/components/dashboard/seller-status-menu'

export function SellerDetailActions({ sellerId, currentStatus }: { sellerId: string; currentStatus: string }) {
  const router = useRouter()
  return (
    <SellerStatusMenu
      sellerId={sellerId}
      currentStatus={currentStatus}
      size="default"
      onUpdated={() => router.refresh()}
    />
  )
}
