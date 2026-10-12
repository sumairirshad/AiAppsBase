import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

/**
 * The AIAppsBase logo mark + wordmark, used everywhere the brand appears
 * (header, footer, auth screens, dashboard sidebars). The mark is the
 * provided logo artwork; the wordmark renders as real text (not baked into
 * the image) so it stays crisp at any size and recolors correctly on both
 * light and dark/gradient backgrounds.
 */
export function BrandLogo({
  href = '/',
  size = 'md',
  textClassName,
  className,
  onClick,
}: {
  href?: string
  size?: 'sm' | 'md' | 'lg'
  textClassName?: string
  className?: string
  onClick?: () => void
}) {
  const markSize = size === 'lg' ? 'size-9' : size === 'sm' ? 'size-7' : 'size-8'
  const textSize = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-base' : 'text-lg'

  return (
    <Link href={href} onClick={onClick} className={cn('flex items-center gap-2', className)}>
      <Image
        src="/images/logo-mark.png"
        alt="AIAppsBase"
        width={154}
        height={164}
        priority
        className={cn('shrink-0 object-contain', markSize)}
      />
      <span className={cn('font-display font-bold tracking-tight', textSize, textClassName)}>
        AIAppsBase
      </span>
    </Link>
  )
}
