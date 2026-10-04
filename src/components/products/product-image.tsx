'use client'

import * as React from 'react'
import Image from 'next/image'

import { cn } from '@/lib/utils'
import { normalizeImageSrc } from '@/lib/image-src'

/** The AIAppsBase logo, shown wherever a product has no image (or its image fails to load). */
export const PRODUCT_IMAGE_FALLBACK = '/images/aiappsbase-logo.svg'


/*
 * Overlays drawn on top of a ProductImage (title, badges, buttons). Add
 * `group/media` to the element that contains both the image and the overlays.
 *
 * Over a real photo they keep a dark scrim with white text so they stay
 * legible on any picture. Over the fallback in the light theme they switch to
 * a light wash with foreground-coloured text, so the placeholder blends into
 * the light UI instead of turning into a dark block. In the dark theme the
 * fallback keeps the original dark styling. (Class names are spelled out in
 * full so Tailwind can find them.)
 */
export const mediaScrimClass =
  'bg-gradient-to-t from-black/70 via-black/10 to-transparent ' +
  'group-has-[[data-fallback]]/media:from-background/95 group-has-[[data-fallback]]/media:via-background/30 ' +
  'dark:group-has-[[data-fallback]]/media:from-black/70 dark:group-has-[[data-fallback]]/media:via-black/10'

export const mediaTextClass =
  'text-white drop-shadow ' +
  'group-has-[[data-fallback]]/media:text-foreground group-has-[[data-fallback]]/media:drop-shadow-none ' +
  'dark:group-has-[[data-fallback]]/media:text-white dark:group-has-[[data-fallback]]/media:drop-shadow'

export const mediaChipClass =
  'bg-black/30 text-white backdrop-blur-md ' +
  'group-has-[[data-fallback]]/media:bg-background/80 group-has-[[data-fallback]]/media:text-foreground ' +
  'group-has-[[data-fallback]]/media:shadow-sm group-has-[[data-fallback]]/media:ring-1 group-has-[[data-fallback]]/media:ring-border ' +
  'dark:group-has-[[data-fallback]]/media:bg-black/30 dark:group-has-[[data-fallback]]/media:text-white ' +
  'dark:group-has-[[data-fallback]]/media:shadow-none dark:group-has-[[data-fallback]]/media:ring-0'

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
  const url = normalizeImageSrc(src)
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => setFailed(false), [url])

  if (!url || failed) {
    return (
      <div data-fallback="" className={cn('absolute inset-0 grid place-items-center bg-muted', className)}>
        <div className="absolute inset-0 bg-grid bg-grid-pattern opacity-30" />
        <Image src={PRODUCT_IMAGE_FALLBACK} alt={alt} width={64} height={64} unoptimized className={cn('relative drop-shadow-md', logoClassName)} />
      </div>
    )
  }

  return (
    <Image
      src={url}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  )
}
