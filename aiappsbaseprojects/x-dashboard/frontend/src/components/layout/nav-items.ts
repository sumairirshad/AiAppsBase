import {
  BadgeCheck,
  CalendarClock,
  Clapperboard,
  FileText,
  LayoutDashboard,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/posts", label: "Posts", icon: FileText },
  { href: "/shorts", label: "Shorts", icon: Clapperboard },
  { href: "/scheduler", label: "Scheduler", icon: CalendarClock },
  { href: "/premium", label: "Twitter Premium", icon: BadgeCheck },
];
