// Hardcoded sample entries used when USE_MOCK_DATA=true, so the UI can be
// tested without touching the local JSON store.

let mockDb = {
  "channel-profile": [
    {
      id: "1",
      title: "Channel About & Tags",
      status: "In Progress",
      notes: "Update channel description and keyword tags.",
      date: "2026-01-05",
    },
  ],
  playlists: [
    {
      id: "1",
      title: "Tisoro Talks Podcast Playlist",
      status: "Published",
      notes: "Main podcast playlist, cover art already uploaded.",
      date: "2026-01-10",
    },
  ],
  podcasts: [
    {
      id: "1",
      title: "Tisoro Talks Ep. 12",
      status: "Scheduled",
      notes: "Golden Visa programs episode.",
      date: "2026-02-01",
    },
  ],
  shorts: [
    {
      id: "1",
      title: "60-second clip: Golden Visa basics",
      status: "Idea",
      notes: "Cut from Ep. 12 podcast, single continuous cut.",
      date: "2026-02-03",
    },
  ],
  videos: [
    {
      id: "1",
      title: "Investment Migration Explained",
      status: "In Progress",
      notes: "Long form video based on 2 articles.",
      date: "2026-01-20",
    },
  ],
  "community-posts": [
    {
      id: "1",
      title: "Poll: Which program interests you most?",
      status: "Idea",
      notes: "Community tab poll with image.",
      date: "2026-01-15",
    },
  ],
  "posting-concept": [
    {
      id: "1",
      title: "Weekly posting schedule",
      status: "In Progress",
      notes: "1 video, 2 shorts, 1 community post per week.",
      date: "2026-01-01",
    },
  ],
  "live-broadcast": [
    {
      id: "1",
      title: "24/7 Live Broadcast Reel",
      status: "Scheduled",
      notes: "Merge scheduled podcast videos into master reel.",
      date: "2026-02-10",
    },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getMockEntries(category) {
  return clone(mockDb[category] || []);
}

export function addMockEntry(category, entry) {
  const list = mockDb[category] || (mockDb[category] = []);
  const newEntry = { ...entry, id: String(Date.now()) };
  list.push(newEntry);
  return clone(newEntry);
}

export function getMockEntry(category, id) {
  const entry = (mockDb[category] || []).find((e) => e.id === id);
  return entry ? clone(entry) : null;
}

export function updateMockEntry(category, id, updates) {
  const list = mockDb[category] || [];
  const index = list.findIndex((e) => e.id === id);
  if (index === -1) return null;
  list[index] = { ...list[index], ...updates, id };
  return clone(list[index]);
}
