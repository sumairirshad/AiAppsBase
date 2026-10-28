/**
 * Display metadata (label + icon) for the funding/sponsorship platforms
 * GitHub's own FUNDING.yml schema recognizes, keyed by the lowercase
 * platform key produced by src/lib/github-funding.ts. Shared across the
 * buyer product page, seller panel, and admin product list so all three
 * render the same labels for the same platform key.
 */
import {
  Heart, Github, Coffee, HandCoins, Globe, Gift, type LucideIcon,
} from 'lucide-react'

export type FundingPlatformMeta = { label: string; icon: LucideIcon }

export const FUNDING_PLATFORM_META: Record<string, FundingPlatformMeta> = {
  github: { label: 'GitHub Sponsors', icon: Github },
  patreon: { label: 'Patreon', icon: HandCoins },
  open_collective: { label: 'Open Collective', icon: Globe },
  ko_fi: { label: 'Ko-fi', icon: Coffee },
  buy_me_a_coffee: { label: 'Buy Me a Coffee', icon: Coffee },
  liberapay: { label: 'Liberapay', icon: HandCoins },
  tidelift: { label: 'Tidelift', icon: Gift },
  community_bridge: { label: 'Community Bridge', icon: Globe },
  lfx_crowdfunding: { label: 'LFX Crowdfunding', icon: Globe },
  issuehunt: { label: 'IssueHunt', icon: Gift },
  otechie: { label: 'Otechie', icon: Gift },
  polar: { label: 'Polar', icon: Gift },
  thanks_dev: { label: 'thanks.dev', icon: Heart },
  custom: { label: 'Donate', icon: Heart },
}

export function fundingPlatformLabel(platform: string): string {
  return FUNDING_PLATFORM_META[platform]?.label ?? platform
}

export function fundingPlatformIcon(platform: string): LucideIcon {
  return FUNDING_PLATFORM_META[platform]?.icon ?? Heart
}
