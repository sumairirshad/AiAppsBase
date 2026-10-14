// `realCapability` says what happens when USE_MOCK_DATA=false:
// - "local"           no real YouTube endpoint exists for this; always
//                      stored in the local JSON file, in both modes.
// - "branding"        real mode updates the channel's branding via OAuth.
// - "playlist"        real mode creates/updates a real playlist via OAuth.
// - "broadcast"       real mode schedules a real live broadcast via OAuth.
// - "upload"          real mode uploads a real video file via OAuth
//                      (requires a video file on the add form).
export const CATEGORIES = [
  { slug: "channel-profile", label: "Channel Profile", realCapability: "branding" },
  { slug: "playlists", label: "Playlists", realCapability: "playlist" },
  { slug: "podcasts", label: "Podcasts", realCapability: "local" },
  { slug: "shorts", label: "Shorts", realCapability: "upload" },
  { slug: "videos", label: "Videos", realCapability: "upload" },
  { slug: "community-posts", label: "Community Posts", realCapability: "local" },
  { slug: "posting-concept", label: "Posting Concept", realCapability: "local" },
  { slug: "live-broadcast", label: "Live Broadcast", realCapability: "broadcast" },
];

export function getCategory(slug) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export const STATUS_OPTIONS = ["Idea", "In Progress", "Scheduled", "Published"];

export const UPLOAD_CATEGORIES = new Set(
  CATEGORIES.filter((c) => c.realCapability === "upload").map((c) => c.slug)
);
