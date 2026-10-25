export interface ConnectedAccount {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bioDescription: string | null;
  isVerified: boolean;
  followerCount: number;
  videoCount: number;
  grantedScopes: string;
  isActive: boolean;
  connectedAt: string;
  accessTokenExpiresAt: string;
}

export interface MediaAsset {
  id: string;
  mediaType: string;
  sourceUrl: string;
  order: number;
}

export interface PublishingJob {
  id: string;
  connectedAccountId: string;
  contentType: "Video" | "PhotoPost";
  title: string | null;
  caption: string;
  hashtags: string | null;
  requestedVisibility: string;
  requestDirectPost: boolean;
  status: "Draft" | "Pending" | "Processing" | "PublishedDirect" | "SentToInbox" | "Failed";
  tikTokPublishId: string | null;
  publishedPostId: string | null;
  errorMessage: string | null;
  attemptCount: number;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  mediaAssets: MediaAsset[];
}

export interface VideoStat {
  tikTokVideoId: string;
  title: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  capturedAt: string;
}

export interface CreateJobPayload {
  connectedAccountId: string;
  contentType: "Video" | "PhotoPost";
  title?: string;
  caption: string;
  hashtags?: string;
  mediaUrls: string[];
  requestedVisibility: string;
  requestDirectPost: boolean;
  scheduledAt?: string;
}
