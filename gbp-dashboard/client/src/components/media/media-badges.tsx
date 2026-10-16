import { Badge } from "@/components/ui/badge";
import { MediaCategory, MediaType } from "@/types/media";

export function MediaTypeBadge({ type }: { type: MediaType }) {
  return <Badge variant="secondary">{type}</Badge>;
}

export function MediaCategoryBadge({ category }: { category: MediaCategory }) {
  return <Badge variant="outline">{category}</Badge>;
}
