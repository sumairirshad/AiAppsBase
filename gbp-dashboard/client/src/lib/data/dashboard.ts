import { getBusinessProfile } from "@/lib/data/business-profile";
import { getMediaItems } from "@/lib/data/media";
import { getPosts } from "@/lib/data/posts";
import { BusinessProfile } from "@/types/business-profile";
import { MediaItem } from "@/types/media";
import { Post } from "@/types/post";

export interface DashboardOverview {
  profile: BusinessProfile;
  posts: Post[];
  media: MediaItem[];
  totalPosts: number;
  scheduledPostsCount: number;
  publishedPostsCount: number;
  draftPostsCount: number;
  mediaCount: number;
  recentPosts: Post[];
  upcomingScheduledPosts: Post[];
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [profile, posts, media] = await Promise.all([
    getBusinessProfile(),
    getPosts(),
    getMediaItems(),
  ]);

  const upcomingScheduledPosts = posts
    .filter((post) => post.status === "Scheduled")
    .sort(
      (a, b) =>
        new Date(a.scheduledAt ?? 0).getTime() -
        new Date(b.scheduledAt ?? 0).getTime()
    );

  return {
    profile,
    posts,
    media,
    totalPosts: posts.length,
    scheduledPostsCount: posts.filter((post) => post.status === "Scheduled").length,
    publishedPostsCount: posts.filter((post) => post.status === "Published").length,
    draftPostsCount: posts.filter((post) => post.status === "Draft").length,
    mediaCount: media.length,
    recentPosts: posts.slice(0, 5),
    upcomingScheduledPosts,
  };
}
