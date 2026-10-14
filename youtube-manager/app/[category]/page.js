import { notFound } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { getCategory, UPLOAD_CATEGORIES } from "@/lib/categories";
import { getEntries, getLiveChannelInfo } from "@/lib/dataService";
import { ConfigError } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddEntryForm } from "./add-entry-form";

const STATUS_VARIANT = {
  Idea: "secondary",
  "In Progress": "default",
  Scheduled: "outline",
  Published: "default",
};

export default async function CategoryPage({ params }) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const isMockMode = process.env.USE_MOCK_DATA === "true";
  const entries = getEntries(slug);

  let liveChannelInfo = null;
  let liveChannelError = null;
  if (category.realCapability === "branding" && !isMockMode) {
    try {
      liveChannelInfo = await getLiveChannelInfo();
    } catch (err) {
      liveChannelError = err instanceof ConfigError ? err.errors.join(" ") : err.message;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{category.label}</h1>
        {category.realCapability === "local" && !isMockMode && (
          <p className="text-sm text-muted-foreground">
            Stored locally only — YouTube has no public API for {category.label.toLowerCase()}.
          </p>
        )}
      </div>

      {liveChannelError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Couldn&apos;t load live channel data: {liveChannelError}
        </div>
      )}

      {liveChannelInfo && (
        <div className="flex items-center gap-3 rounded-md border bg-card px-4 py-3">
          {liveChannelInfo.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={liveChannelInfo.thumbnailUrl}
              alt=""
              className="size-10 rounded-full"
            />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium">{liveChannelInfo.title}</span>
            <span className="text-xs text-muted-foreground">
              {liveChannelInfo.subscriberCount} subscribers · {liveChannelInfo.videoCount} videos (live from YouTube)
            </span>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No entries yet. Add one below.
                </TableCell>
              </TableRow>
            )}
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.title}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[entry.status] || "secondary"}>{entry.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{entry.date}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{entry.notes}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem render={<Link href={`/${slug}/${entry.id}`} />}>
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddEntryForm
        category={slug}
        categoryLabel={category.label}
        uploadCapable={UPLOAD_CATEGORIES.has(slug)}
        isMockMode={isMockMode}
      />
    </div>
  );
}
