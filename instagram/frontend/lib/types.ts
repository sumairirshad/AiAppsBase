export type InstagramContentType = "Image" | "Carousel" | "Reels" | "Story";
export type InstagramMediaKind = "Image" | "Video";
export type PublishingJobStatus = "Draft" | "Pending" | "Processing" | "Published" | "Failed";

export interface AccountDto {
  id: string;
  platformUserId: string;
  username: string;
  displayName: string | null;
  profilePictureUrl: string | null;
  accountType: string | null;
  biography: string | null;
  website: string | null;
  followersCount: number | null;
  mediaCount: number | null;
  tokenExpiresAt: string;
  connectedAt: string;
  isActive: boolean;
}

export interface MediaAssetDto {
  id: string;
  url: string;
  mediaKind: InstagramMediaKind;
  sortOrder: number;
}

export interface PublishingJobDto {
  id: string;
  connectedAccountId: string;
  contentType: InstagramContentType;
  caption: string | null;
  hashtags: string | null;
  status: PublishingJobStatus;
  platformMediaId: string | null;
  errorMessage: string | null;
  attemptCount: number;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  mediaAssets: MediaAssetDto[];
}

export interface MetricDto {
  name: string;
  value: number;
  capturedAt: string;
}

export interface ApiError {
  message: string;
  validationErrors?: Record<string, string[]>;
}
