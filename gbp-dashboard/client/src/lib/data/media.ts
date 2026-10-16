import { mediaApi } from "@/lib/api/media-api";
import { readLocalValue, writeLocalValue } from "@/lib/local-store";
import { MediaDraft, MediaItem } from "@/types/media";

interface MediaOverrides {
  created: MediaItem[];
  deletedIds: string[];
}

const OVERRIDES_KEY = "media-overrides";

function readOverrides(): MediaOverrides {
  return (
    readLocalValue<MediaOverrides>(OVERRIDES_KEY) ?? {
      created: [],
      deletedIds: [],
    }
  );
}

function writeOverrides(overrides: MediaOverrides): void {
  writeLocalValue(OVERRIDES_KEY, overrides);
}

function createId(): string {
  return `media-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export async function getMediaItems(): Promise<MediaItem[]> {
  const seedItems = await mediaApi.getAll();
  const overrides = readOverrides();

  const remainingSeedItems = seedItems.filter(
    (item) => !overrides.deletedIds.includes(item.id)
  );
  const createdItems = overrides.created.filter(
    (item) => !overrides.deletedIds.includes(item.id)
  );

  return [...createdItems, ...remainingSeedItems].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

export async function addMediaItem(draft: MediaDraft): Promise<MediaItem> {
  const item: MediaItem = {
    ...draft,
    id: createId(),
    uploadedAt: new Date().toISOString(),
  };

  const overrides = readOverrides();
  overrides.created.push(item);
  writeOverrides(overrides);
  return item;
}

export async function deleteMediaItem(id: string): Promise<void> {
  const overrides = readOverrides();
  overrides.created = overrides.created.filter((item) => item.id !== id);
  if (!overrides.deletedIds.includes(id)) {
    overrides.deletedIds.push(id);
  }
  writeOverrides(overrides);
}
