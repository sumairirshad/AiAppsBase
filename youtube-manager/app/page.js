import Link from "next/link";
import {
  CalendarClock,
  CircleUserRound,
  ListVideo,
  Mic2,
  MessageSquareText,
  Radio,
  Video,
  Zap,
} from "lucide-react";

import { CATEGORIES } from "@/lib/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Content Planner</h1>
        <p className="text-sm text-muted-foreground">
          Pick a category to view or plan entries.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((category) => {
          const Icon = ICONS[category.slug];
          return (
            <Link key={category.slug} href={`/${category.slug}`}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2.5 text-base">
                    <Icon className="size-4 text-primary" />
                    {category.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  View, add, and edit {category.label.toLowerCase()} entries.
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
