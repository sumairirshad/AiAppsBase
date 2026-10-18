export type PostType = "Text" | "Image";
export type AccountType = "Personal" | "Business";
export type ScheduleStatus = "Scheduled" | "Published" | "Failed";

export interface Profile {
  handle: string;
  displayName: string;
  bio: string;
  profilePictureUrl: string;
  coverImageUrl: string;
  /** Best-effort derived from X's verification type; X does not expose a direct "account type"
   * field over the API. Not editable -- see UpdateProfileRequest. */
  accountType: AccountType;
  /** Always empty: professional account category is not exposed by the X API. */
  category: string;
  /** Always empty: contact info is not exposed by the X API. */
  phone: string;
  /** Always empty: contact info is not exposed by the X API. */
  email: string;
  location: string;
  website: string;
  pinnedPostId: string | null;
  joinedAt: string;
  followersCount: number;
  followingCount: number;
}

/** Only the fields the X API actually supports updating (legacy v1.1 account/update_profile +
 * the pinned-post endpoint). Profile picture/cover use dedicated upload endpoints
 * (profileApi.uploadPicture/uploadBanner) since X requires raw image bytes, not a URL. */
export interface UpdateProfileRequest {
  displayName: string;
  bio: string;
  location: string;
  website: string;
  pinnedPostId: string | null;
}

export interface Post {
  id: string;
  authorHandle: string;
  type: PostType;
  text: string;
  imageUrls: string[];
  createdAt: string;
  likes: number;
  reposts: number;
  replies: number;
  views: number;
  isPinned: boolean;
}

export interface CreatePostRequest {
  type: PostType;
  text: string;
  /** Media ids from mediaApi.upload(file, "image"); required and non-empty when type is Image. */
  mediaIds: string[];
}

export interface Short {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  description: string;
  hashtags: string[];
  createdAt: string;
  views: number;
  likes: number;
  duration: string;
}

export interface CreateShortRequest {
  /** Media id from mediaApi.upload(file, "video"). */
  mediaId: string;
  caption: string;
  description: string;
  hashtags: string[];
}

export interface ScheduledPost {
  id: string;
  type: PostType;
  text: string;
  mediaIds: string[];
  scheduledFor: string;
  status: ScheduleStatus;
  publishedPostId: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface CreateScheduledPostRequest {
  type: PostType;
  text: string;
  mediaIds: string[];
  scheduledFor: string;
}

export interface UpdateScheduledPostRequest {
  text: string;
  mediaIds: string[];
  scheduledFor: string;
}

/** Derived from the X API's subscription_type / verified_type user fields. X does not expose a
 * subscription start date, renewal date, or benefits list over the API. */
export interface PremiumStatus {
  isSubscribed: boolean;
  tier: string;
  hasVerifiedBadge: boolean;
  verifiedType: string;
}

export interface EngagementPoint {
  date: string;
  likes: number;
  reposts: number;
  views: number;
}

export interface DashboardSummary {
  handle: string;
  displayName: string;
  profilePictureUrl: string;
  hasVerifiedBadge: boolean;
  totalPosts: number;
  totalShorts: number;
  scheduledCount: number;
  totalLikes: number;
  totalViews: number;
  totalReposts: number;
  recentPosts: Post[];
  upcomingScheduled: ScheduledPost[];
  engagementOverTime: EngagementPoint[];
}

export interface ConnectionStatus {
  connected: boolean;
  handle?: string;
  displayName?: string;
  profileImageUrl?: string;
  error?: string;
  rateLimited?: boolean;
}

export interface MediaUploadResult {
  mediaId: string;
}
