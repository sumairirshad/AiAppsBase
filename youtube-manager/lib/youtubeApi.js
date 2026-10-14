// Real YouTube Data API v3 calls. Every function validates env first and
// throws ConfigError if anything required is missing/invalid — callers
// (lib/realData.js) let that error bubble up as a clear message to the UI.
//
// Everything created here defaults to privacyStatus "private" so nothing
// goes live on the real channel by accident from a planning tool.
//
// NOTE: these calls are written against the documented YouTube Data API v3
// request/response shapes but have not been exercised against a real
// Google Cloud project in this environment (no real credentials available
// here) — verify end-to-end against your own channel before relying on it.

import { Readable } from "stream";
import { google } from "googleapis";
import { assertYoutubeEnv } from "./env";
import { getOAuthClient } from "./googleAuth";

function youtubeReadOnly() {
  return google.youtube({ version: "v3", auth: process.env.YOUTUBE_API_KEY });
}

function youtubeWritable() {
  return google.youtube({ version: "v3", auth: getOAuthClient() });
}

export async function getChannelInfo() {
  assertYoutubeEnv();
  const youtube = youtubeReadOnly();
  const res = await youtube.channels.list({
    part: ["snippet", "statistics"],
    id: [process.env.YOUTUBE_CHANNEL_ID],
  });
  const channel = res.data.items?.[0];
  if (!channel) {
    throw new Error("YouTube API returned no channel for YOUTUBE_CHANNEL_ID.");
  }
  return {
    title: channel.snippet.title,
    thumbnailUrl: channel.snippet.thumbnails?.default?.url,
    subscriberCount: channel.statistics?.subscriberCount,
    videoCount: channel.statistics?.videoCount,
  };
}

export async function updateChannelBranding({ title, description }) {
  assertYoutubeEnv();
  const youtube = youtubeWritable();
  const current = await youtube.channels.list({
    part: ["brandingSettings"],
    id: [process.env.YOUTUBE_CHANNEL_ID],
  });
  const channel = current.data.items?.[0];
  if (!channel) {
    throw new Error("Could not load the current channel to update branding.");
  }
  const res = await youtube.channels.update({
    part: ["brandingSettings"],
    requestBody: {
      id: process.env.YOUTUBE_CHANNEL_ID,
      brandingSettings: {
        ...channel.brandingSettings,
        channel: {
          ...channel.brandingSettings?.channel,
          title,
          description,
        },
      },
    },
  });
  return { id: res.data.id };
}

export async function createPlaylist({ title, description }) {
  assertYoutubeEnv();
  const youtube = youtubeWritable();
  const res = await youtube.playlists.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: { title, description },
      status: { privacyStatus: "private" },
    },
  });
  return {
    youtubeId: res.data.id,
    youtubeUrl: `https://www.youtube.com/playlist?list=${res.data.id}`,
  };
}

export async function updatePlaylist({ youtubeId, title, description }) {
  assertYoutubeEnv();
  const youtube = youtubeWritable();
  await youtube.playlists.update({
    part: ["snippet"],
    requestBody: {
      id: youtubeId,
      snippet: { title, description },
    },
  });
  return { youtubeId };
}

export async function updateLiveBroadcast({ youtubeId, title, description }) {
  assertYoutubeEnv();
  const youtube = youtubeWritable();
  await youtube.liveBroadcasts.update({
    part: ["snippet"],
    requestBody: {
      id: youtubeId,
      snippet: { title, description },
    },
  });
  return { youtubeId };
}

export async function updateVideoMetadata({ youtubeId, title, description }) {
  assertYoutubeEnv();
  const youtube = youtubeWritable();
  await youtube.videos.update({
    part: ["snippet"],
    requestBody: {
      id: youtubeId,
      // The Data API treats `snippet` as a full replacement, so categoryId
      // must be re-sent on update or the call is rejected.
      snippet: { title, description, categoryId: "22" },
    },
  });
  return { youtubeId };
}

export async function insertLiveBroadcast({ title, description, scheduledStartTime }) {
  assertYoutubeEnv();
  const youtube = youtubeWritable();
  const res = await youtube.liveBroadcasts.insert({
    part: ["snippet", "status", "contentDetails"],
    requestBody: {
      snippet: {
        title,
        description,
        scheduledStartTime: scheduledStartTime || new Date().toISOString(),
      },
      status: { privacyStatus: "private" },
      contentDetails: { enableAutoStart: false, enableAutoStop: false },
    },
  });
  return {
    youtubeId: res.data.id,
    youtubeUrl: `https://studio.youtube.com/video/${res.data.id}/livestreaming`,
  };
}

// Shared by both Videos and Shorts — YouTube has no separate "insert as
// Short" call; a Short is just a regular upload (vertical, <=60s).
export async function uploadVideo({ title, description, fileBuffer }) {
  assertYoutubeEnv();
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error("A video file is required to upload to YouTube.");
  }
  const youtube = youtubeWritable();
  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: { title, description },
      status: { privacyStatus: "private" },
    },
    media: {
      body: Readable.from(fileBuffer),
    },
  });
  return {
    youtubeId: res.data.id,
    youtubeUrl: `https://www.youtube.com/watch?v=${res.data.id}`,
  };
}
