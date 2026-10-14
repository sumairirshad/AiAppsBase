import { google } from "googleapis";

// OAuth2 client for write calls (playlists, channel branding, live
// broadcasts, video uploads). Read-only calls use the plain API key instead
// — see lib/youtubeApi.js.
export function getOAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
  return oauth2Client;
}
