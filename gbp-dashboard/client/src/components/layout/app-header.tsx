"use client";

import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/components/layout/nav-items";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  const pathname = usePathname();
  const activeItem = NAV_ITEMS.find((item) => item.href === pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <h1 className="text-sm font-medium">
        {activeItem?.title ?? "Dashboard"}
      </h1>
    </header>
  );
}
