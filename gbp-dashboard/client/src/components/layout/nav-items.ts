import {
  CalendarClock,
  ImageIcon,
  LayoutDashboard,
  Images,
  Megaphone,
  Store,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Logo & Cover", href: "/logo-cover", icon: ImageIcon },
  { title: "Business Profile", href: "/business-profile", icon: Store },
  { title: "Posts", href: "/posts", icon: Megaphone },
  { title: "Scheduler", href: "/scheduler", icon: CalendarClock },
  { title: "Media Gallery", href: "/media-gallery", icon: Images },
];
