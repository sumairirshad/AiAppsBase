export const CATEGORIES = [
  { slug: "channel-profile", label: "Channel Profile" },
  { slug: "playlists", label: "Playlists" },
  { slug: "podcasts", label: "Podcasts" },
  { slug: "shorts", label: "Shorts" },
  { slug: "videos", label: "Videos" },
  { slug: "community-posts", label: "Community Posts" },
  { slug: "posting-concept", label: "Posting Concept" },
  { slug: "live-broadcast", label: "Live Broadcast" },
];

export function getCategory(slug) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export const STATUS_OPTIONS = ["Idea", "In Progress", "Scheduled", "Published"];
