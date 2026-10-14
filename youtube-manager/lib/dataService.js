// Single service layer the app talks to. In mock mode everything goes
// through the in-memory mock store, no network calls are made. In real
// mode, categories with a real YouTube write capability (see
// lib/categories.js) call the YouTube API first and only persist locally
// once that succeeds; categories with no real equivalent always use the
// local JSON store, in both modes.

import { getCategory } from "./categories";
import {
  getMockEntries,
  addMockEntry,
  getMockEntry,
  updateMockEntry,
} from "./mockData";
import {
  getRealEntries,
  addRealEntry,
  getRealEntry,
  updateRealEntry,
} from "./realData";
import * as youtubeApi from "./youtubeApi";

function useMock() {
  return process.env.USE_MOCK_DATA === "true";
}

export function getEntries(category) {
  return useMock() ? getMockEntries(category) : getRealEntries(category);
}

export function getEntry(category, id) {
  return useMock() ? getMockEntry(category, id) : getRealEntry(category, id);
}

// Read-only live channel stats for the Channel Profile page. Returns null
// in mock mode (nothing to fetch); callers handle ConfigError/API errors.
export async function getLiveChannelInfo() {
  if (useMock()) return null;
  return youtubeApi.getChannelInfo();
}

export async function addEntry(category, fields, file) {
  if (useMock()) {
    const fileMeta = file ? { fileName: file.name, fileSize: file.size } : {};
    return addMockEntry(category, { ...fields, ...fileMeta });
  }

  const meta = getCategory(category);
  const youtubeFields = await createOnYoutube(meta.realCapability, fields, file);
  return addRealEntry(category, { ...fields, ...youtubeFields });
}

export async function updateEntry(category, id, fields) {
  if (useMock()) {
    return updateMockEntry(category, id, fields);
  }

  const meta = getCategory(category);
  const existing = getRealEntry(category, id);
  await updateOnYoutube(meta.realCapability, existing, fields);
  return updateRealEntry(category, id, fields);
}

async function createOnYoutube(realCapability, fields, file) {
  switch (realCapability) {
    case "branding": {
      const result = await youtubeApi.updateChannelBranding({
        title: fields.title,
        description: fields.notes,
      });
      return { youtubeId: result.id };
    }
    case "playlist":
      return youtubeApi.createPlaylist({ title: fields.title, description: fields.notes });
    case "broadcast":
      return youtubeApi.insertLiveBroadcast({
        title: fields.title,
        description: fields.notes,
        scheduledStartTime: fields.date ? new Date(fields.date).toISOString() : undefined,
      });
    case "upload": {
      if (!file) {
        throw new Error("A video file is required to upload to YouTube.");
      }
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      return youtubeApi.uploadVideo({ title: fields.title, description: fields.notes, fileBuffer });
    }
    default:
      return {};
  }
}

async function updateOnYoutube(realCapability, existing, fields) {
  if (!existing?.youtubeId) return;
  switch (realCapability) {
    case "branding":
      await youtubeApi.updateChannelBranding({ title: fields.title, description: fields.notes });
      return;
    case "playlist":
      await youtubeApi.updatePlaylist({
        youtubeId: existing.youtubeId,
        title: fields.title,
        description: fields.notes,
      });
      return;
    case "broadcast":
      await youtubeApi.updateLiveBroadcast({
        youtubeId: existing.youtubeId,
        title: fields.title,
        description: fields.notes,
      });
      return;
    case "upload":
      await youtubeApi.updateVideoMetadata({
        youtubeId: existing.youtubeId,
        title: fields.title,
        description: fields.notes,
      });
      return;
    default:
      return;
  }
}
