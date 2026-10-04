'use client'

import * as React from 'react'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, RefreshCw, Star, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ProductImage } from '@/components/products/product-image'

export const MAX_PRODUCT_IMAGES = 8
const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif'

/**
 * Lets a seller manage a product's images: replace, remove, reorder (the
 * first image is the cover) and add. New files are uploaded straight away for
 * a preview; the product itself only changes when the form is saved.
 */
export function ProductImagesEditor({
  productId, images, onChange,
}: {
  productId: string
  images: string[]
  onChange: (images: string[]) => void
}) {
  // Which slot is uploading: an index (replace) or 'new' (add).
  const [busy, setBusy] = React.useState<number | 'new' | null>(null)

  async function upload(files: File[]): Promise<string[]> {
    for (const f of files) {
      if (!ACCEPT.split(',').includes(f.type)) throw new Error(`"${f.name}" isn't a supported image type. Use JPG, PNG, WEBP, or GIF.`)
      if (f.size > MAX_BYTES) throw new Error(`"${f.name}" is larger than 5MB.`)
    }
    const fd = new FormData()
    files.forEach((f) => fd.append('images', f))
    const res = await fetch(`/api/products/${productId}/images`, { method: 'POST', body: fd })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Failed to upload images')
    return data.paths as string[]
  }

  async function add(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])
    if (!files.length) return
    const room = MAX_PRODUCT_IMAGES - images.length
    if (files.length > room) toast.error(`Only ${room} more image${room === 1 ? '' : 's'} can be added (max ${MAX_PRODUCT_IMAGES}).`)
    const batch = files.slice(0, room)
    if (!batch.length) return
    setBusy('new')
    try {
      const paths = await upload(batch)
      onChange([...images, ...paths])
      toast.success(`${paths.length} image${paths.length === 1 ? '' : 's'} added — save to apply`)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function replace(index: number, file: File | undefined) {
    if (!file) return
    setBusy(index)
    try {
      const [path] = await upload([file])
      onChange(images.map((img, i) => (i === index ? path : img)))
      toast.success('Image replaced — save to apply')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const remove = (index: number) => onChange(images.filter((_, i) => i !== index))
  const move = (index: number, to: number) => {
    if (to < 0 || to >= images.length) return
    const next = [...images]
    const [item] = next.splice(index, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  const iconBtn =
    'grid size-8 place-items-center rounded-md bg-background/90 text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-40'

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Product images</p>
          <p className="text-xs text-muted-foreground">
            The first image is the cover shown on cards and the product page. PNG, JPG, WEBP or GIF up to 5MB each.
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{images.length}/{MAX_PRODUCT_IMAGES}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((src, i) => (
          <div key={`${src}-${i}`} className="group/media relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
            <ProductImage src={src} alt={`Product image ${i + 1}`} logoClassName="size-8" sizes="240px" />
            <div className="absolute left-2 top-2">
              {i === 0
                ? <Badge className="gap-1 border-0 bg-primary text-primary-foreground shadow-sm"><Star className="size-3" /> Cover</Badge>
                : <Badge className="border-0 bg-background/90 text-foreground shadow-sm ring-1 ring-border">#{i + 1}</Badge>}
            </div>
            {busy === i && (
              <div className="absolute inset-0 grid place-items-center bg-background/70">
                <Loader2 className="size-5 animate-spin text-primary" />
              </div>
            )}
            <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1">
              <div className="flex gap-1">
                <button type="button" className={iconBtn} onClick={() => move(i, i - 1)} disabled={i === 0 || busy !== null} aria-label={`Move image ${i + 1} left`} title={i === 1 ? 'Make cover' : 'Move left'}>
                  <ArrowLeft className="size-4" />
                </button>
                <button type="button" className={iconBtn} onClick={() => move(i, i + 1)} disabled={i === images.length - 1 || busy !== null} aria-label={`Move image ${i + 1} right`} title="Move right">
                  <ArrowRight className="size-4" />
                </button>
              </div>
              <div className="flex gap-1">
                <label className={cn(iconBtn, 'cursor-pointer', busy !== null && 'pointer-events-none opacity-40')} title="Replace image" aria-label={`Replace image ${i + 1}`}>
                  <RefreshCw className="size-4" />
                  <input type="file" accept={ACCEPT} className="hidden" disabled={busy !== null}
                    onChange={(e) => { replace(i, e.target.files?.[0]); e.target.value = '' }} />
                </label>
                <button type="button" className={cn(iconBtn, 'hover:text-destructive')} onClick={() => remove(i)} disabled={busy !== null} aria-label={`Remove image ${i + 1}`} title="Remove image">
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {images.length < MAX_PRODUCT_IMAGES && (
          <label
            className={cn(
              'relative flex aspect-video cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border text-center text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground',
              busy !== null && 'pointer-events-none opacity-60'
            )}
          >
            {busy === 'new' ? <Loader2 className="size-6 animate-spin text-primary" /> : <ImagePlus className="size-6" />}
            <span className="text-xs font-medium">{busy === 'new' ? 'Uploading…' : images.length ? 'Add images' : 'Upload images'}</span>
            <input type="file" accept={ACCEPT} multiple className="hidden" disabled={busy !== null}
              onChange={(e) => { add(e.target.files); e.target.value = '' }} />
          </label>
        )}
      </div>

      {images.length === 0 && (
        <p className="text-xs text-muted-foreground">No images yet — buyers will see the AIAppsBase placeholder until you add one.</p>
      )}
    </div>
  )
}
