'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { normalizeImageSrc } from '@/lib/image-src'

const SWIPE_THRESHOLD = 50

/**
 * Facebook-style fullscreen image gallery/lightbox. Controlled: the caller
 * owns `open` and `index` so the underlying product page (and its own
 * gallery preview state) is untouched while this is open — closing it just
 * returns to the page exactly as it was.
 */
export function ImageLightbox({
  images, alt, open, onOpenChange, index, onIndexChange,
}: {
  images: string[]
  alt: string
  open: boolean
  onOpenChange: (open: boolean) => void
  index: number
  onIndexChange: (index: number) => void
}) {
  const count = images.length
  const touchStartX = React.useRef<number | null>(null)

  const goTo = React.useCallback((i: number) => {
    if (count === 0) return
    onIndexChange(((i % count) + count) % count) // wrap around, Facebook-style
  }, [count, onIndexChange])

  const prev = React.useCallback(() => goTo(index - 1), [goTo, index])
  const next = React.useCallback(() => goTo(index + 1), [goTo, index])

  // Left/Right arrow navigation. Escape-to-close is handled by Radix Dialog itself.
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, prev, next])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
    touchStartX.current = null
    if (dx > SWIPE_THRESHOLD) prev()
    else if (dx < -SWIPE_THRESHOLD) next()
  }

  if (count === 0) return null
  const src = normalizeImageSrc(images[index])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-[100] bg-black/95',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-0 z-[100] flex flex-col outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
          )}
          onClick={() => onOpenChange(false)}
          aria-label={`${alt} — image gallery`}
        >
          <DialogPrimitive.Title className="sr-only">{alt} — image gallery</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Use the left and right arrow keys to move between images, or Escape to close.
          </DialogPrimitive.Description>

          {/* Top bar — empty padding here still closes the gallery (click-outside); only the badge and button themselves don't. */}
          <div className="flex shrink-0 items-center justify-between p-4 text-white/90 sm:p-5">
            {count > 1 ? (
              <span onClick={(e) => e.stopPropagation()} className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm">{index + 1} / {count}</span>
            ) : <span />}
            <DialogPrimitive.Close
              onClick={(e) => e.stopPropagation()}
              className="rounded-full p-2 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Close gallery"
            >
              <X className="size-6" />
            </DialogPrimitive.Close>
          </div>

          {/* Stage */}
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {count > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev() }}
                aria-label="Previous image"
                className="absolute left-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-110 sm:left-4 sm:flex"
              >
                <ChevronLeft className="size-6" />
              </button>
            )}

            <div
              className="relative h-[70vh] w-full max-w-5xl sm:h-[78vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {src && (
                <Image
                  key={src}
                  src={src}
                  alt={`${alt} — image ${index + 1} of ${count}`}
                  fill
                  sizes="(min-width: 1024px) 80vw, 100vw"
                  className="object-contain"
                  priority
                />
              )}
            </div>

            {count > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next() }}
                aria-label="Next image"
                className="absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-110 sm:right-4 sm:flex"
              >
                <ChevronRight className="size-6" />
              </button>
            )}
          </div>

          {/* Mobile prev/next (swipe is primary, these are a fallback) */}
          {count > 1 && (
            <div className="flex shrink-0 items-center justify-center gap-10 pb-2 sm:hidden">
              <button type="button" onClick={(e) => { e.stopPropagation(); prev() }} aria-label="Previous image" className="rounded-full bg-white/10 p-3 text-white">
                <ChevronLeft className="size-5" />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); next() }} aria-label="Next image" className="rounded-full bg-white/10 p-3 text-white">
                <ChevronRight className="size-5" />
              </button>
            </div>
          )}

          {/* Thumbnail strip — empty padding around the thumbnails still closes the gallery; only the thumbnails themselves don't. */}
          {count > 1 && (
            <div className="shrink-0 overflow-x-auto px-4 pb-5 pt-2 sm:px-6">
              <div className="mx-auto flex w-fit gap-2">
                {images.map((img, i) => {
                  const thumbSrc = normalizeImageSrc(img)
                  if (!thumbSrc) return null
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onIndexChange(i) }}
                      aria-label={`Go to image ${i + 1}`}
                      aria-current={i === index}
                      className={cn(
                        'relative size-14 shrink-0 overflow-hidden rounded-lg transition-all sm:size-16',
                        i === index ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-80'
                      )}
                    >
                      <Image src={thumbSrc} alt="" fill sizes="64px" className="object-cover" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
