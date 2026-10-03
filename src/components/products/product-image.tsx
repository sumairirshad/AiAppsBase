'use client'

import * as React from 'react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

/** The AIAppsBase logo, shown wherever a product has no image (or its image fails to load). */
export const PRODUCT_IMAGE_FALLBACK = '/images/aiappsbase-logo.svg'

/**
 * A product's image, filling its (relatively positioned, sized) parent.
 * Falls back to the AIAppsBase logo on a neutral background when `src` is
 * empty or broken. `logoClassName` sizes the fallback logo.
 */
export function ProductImage({
  src, alt, className, logoClassName = 'size-12', sizes = '(min-width: 1024px) 33vw, 100vw',
}: {
  src?: string | null
  alt: string
  className?: string
  logoClassName?: string
  sizes?: string
}) {
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => setFailed(false), [src])

  if (!src || failed) {
    return (
      <div className={cn('absolute inset-0 grid place-items-center bg-muted', className)}>
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30" />
        <Image src={PRODUCT_IMAGE_FALLBACK} alt={alt} width={64} height={64} unoptimized className={cn('relative drop-shadow-md', logoClassName)} />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  )
}
