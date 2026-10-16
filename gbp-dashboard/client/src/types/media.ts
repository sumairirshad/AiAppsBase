export type MediaType = "Photo" | "Video";

export type MediaCategory =
  | "Interior"
  | "Exterior"
  | "Product"
  | "Team"
  | "Food"
  | "Other";

export interface MediaItem {
  id: string;
  type: MediaType;
  category: MediaCategory;
  url: string;
  thumbnailUrl: string;
  caption: string;
  uploadedAt: string;
}

export type MediaDraft = Omit<MediaItem, "id" | "uploadedAt">;
