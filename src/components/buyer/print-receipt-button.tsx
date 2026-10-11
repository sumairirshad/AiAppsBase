'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrintReceiptButton() {
  return (
    <Button size="sm" variant="outline" onClick={() => window.print()}>
      <Printer className="size-4" /> Print / Save as PDF
    </Button>
  )
}
