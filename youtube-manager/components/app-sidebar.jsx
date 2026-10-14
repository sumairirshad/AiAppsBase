"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  CircleUserRound,
  ListVideo,
  Mic2,
  MessageSquareText,
  Play,
  Radio,
  Video,
  Zap,
} from "lucide-react";

import { CATEGORIES } from "@/lib/categories";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const ICONS = {
  "channel-profile": CircleUserRound,
  playlists: ListVideo,
  podcasts: Mic2,
  shorts: Zap,
  videos: Video,
  "community-posts": MessageSquareText,
  "posting-concept": CalendarClock,
  "live-broadcast": Radio,
};

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Play className="size-4 fill-current" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Content Planner</span>
                <span className="text-xs text-muted-foreground">
                  Channel plan
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Categories</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {CATEGORIES.map((category) => {
                const Icon = ICONS[category.slug];
                const href = `/${category.slug}`;
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <SidebarMenuItem key={category.slug}>
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={isActive}
                      tooltip={category.label}
                    >
                      <Icon />
                      <span>{category.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
