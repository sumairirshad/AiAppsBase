export type PostType = "Text" | "Image";
export type AccountType = "Personal" | "Business";
export type ScheduleStatus = "Scheduled" | "Published" | "Failed";

export interface Profile {
  handle: string;
  displayName: string;
  bio: string;
  profilePictureUrl: string;
  coverImageUrl: string;
  accountType: AccountType;
  category: string;
  phone: string;
  email: string;
  location: string;
  website: string;
  pinnedPostId: string | null;
  joinedAt: string;
}

export interface UpdateProfileRequest {
  displayName: string;
  bio: string;
  profilePictureUrl: string;
  coverImageUrl: string;
  accountType: AccountType;
  category: string;
  phone: string;
  email: string;
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
  imageUrls: string[];
}

export interface UpdatePostRequest {
  text: string;
  imageUrls: string[];
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
  fileName: string;
  caption: string;
  description: string;
  hashtags: string[];
}

export interface ScheduledPost {
  id: string;
  type: PostType;
  text: string;
  imageUrls: string[];
  scheduledFor: string;
  status: ScheduleStatus;
  publishedPostId: string | null;
  createdAt: string;
}

export interface CreateScheduledPostRequest {
  type: PostType;
  text: string;
  imageUrls: string[];
  scheduledFor: string;
}

export interface UpdateScheduledPostRequest {
  text: string;
  imageUrls: string[];
  scheduledFor: string;
}

export interface PremiumStatus {
  isSubscribed: boolean;
  tier: string;
  hasVerifiedBadge: boolean;
  subscribedSince: string | null;
  renewsOn: string | null;
  benefits: string[];
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
