"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BadgeCheck, Link2, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { navItems } from "@/components/layout/nav-items";
import { useProfile } from "@/hooks/use-profile";
import { usePremiumStatus } from "@/hooks/use-premium-status";
import { useConnectionStatus, useDisconnectX } from "@/hooks/use-connection";
import { connectionApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function Sidebar() {
  const pathname = usePathname();
  const { data: connection, isLoading: isConnectionLoading } = useConnectionStatus();
  const { data: profile } = useProfile();
  const { data: premiumStatus } = usePremiumStatus();
  const disconnect = useDisconnectX();

  return (
    <aside className="hidden h-screen w-64 flex-col border-r bg-card md:flex">
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <span className="text-lg font-bold">X</span>
        </div>
        <span className="text-lg font-semibold">X Dashboard</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        {isConnectionLoading && (
          <div className="flex items-center gap-3 p-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        )}

        {!isConnectionLoading && connection && !connection.connected && (
          <Button asChild className="w-full" size="sm">
            <a href={connectionApi.loginUrl()}>
              <Link2 className="h-4 w-4" />
              Connect to X
            </a>
          </Button>
        )}

        {!isConnectionLoading && connection?.connected && profile && (
          <div className="group flex items-center gap-3 rounded-lg p-2 hover:bg-accent">
            <Link href="/profile" className="flex min-w-0 flex-1 items-center gap-3">
              {profile.profilePictureUrl ? (
                <Image
                  src={profile.profilePictureUrl}
                  alt={profile.displayName}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="truncate text-sm font-semibold">
                    {profile.displayName}
                  </p>
                  {premiumStatus?.hasVerifiedBadge && (
                    <BadgeCheck className="h-4 w-4 shrink-0 fill-primary text-primary-foreground" />
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  @{profile.handle}
                </p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100"
              title="Disconnect X account"
              onClick={() => disconnect.mutate()}
              disabled={disconnect.isPending}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}

        {!isConnectionLoading && connection?.connected && !profile && (
          <div className="flex items-center gap-3 p-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
