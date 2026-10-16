import { Badge } from "@/components/ui/badge";
import { PostStatus, PostType } from "@/types/post";

const STATUS_VARIANT: Record<PostStatus, "secondary" | "default" | "outline"> = {
  Draft: "outline",
  Scheduled: "secondary",
  Published: "default",
};

const TYPE_LABEL: Record<PostType, string> = {
  Update: "Update",
  Event: "Event",
  Offer: "Offer",
};

export function PostStatusBadge({ status }: { status: PostStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}

export function PostTypeBadge({ type }: { type: PostType }) {
  return <Badge variant="outline">{TYPE_LABEL[type]}</Badge>;
}
