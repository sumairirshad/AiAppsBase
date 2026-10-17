"use client";

import { usePathname } from "next/navigation";

import { MobileNav } from "@/components/layout/mobile-nav";
import { navItems } from "@/components/layout/nav-items";

export function Header() {
  const pathname = usePathname();
  const current = navItems.find((item) => item.href === pathname);

  return (
    <header className="flex h-16 items-center gap-3 border-b bg-background px-4 md:px-8">
      <MobileNav />
      <h1 className="text-lg font-semibold">{current?.label ?? "X Dashboard"}</h1>
    </header>
  );
}
