export type PostType = "Update" | "Event" | "Offer";

export type PostStatus = "Draft" | "Scheduled" | "Published";

export interface Post {
  id: string;
  type: PostType;
  status: PostStatus;
  title: string;
  body: string;
  imageUrl: string;
  actionButtonLabel: string;
  actionButtonUrl: string;
  eventStartAt: string | null;
  eventEndAt: string | null;
  offerCode: string;
  offerValidUntil: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PostDraft = Omit<Post, "id" | "createdAt" | "updatedAt">;
