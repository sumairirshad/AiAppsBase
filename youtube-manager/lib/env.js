// Validates the env vars required for real YouTube API calls. Used as a
// gate before any real network call — never lets a missing/malformed var
// fail silently.

export class ConfigError extends Error {
  constructor(errors) {
    super(errors.join(" "));
    this.name = "ConfigError";
    this.errors = errors;
  }
}

export function validateYoutubeEnv() {
  const errors = [];

  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!apiKey || apiKey.length < 20 || /\s/.test(apiKey)) {
    errors.push("YOUTUBE_API_KEY is missing or doesn't look like a valid API key.");
  }
  if (!channelId || !/^UC[\w-]{22}$/.test(channelId)) {
    errors.push(
      "YOUTUBE_CHANNEL_ID is missing or not a valid channel ID (expected format: starts with 'UC', 24 characters total)."
    );
  }
  if (!clientId || !clientId.endsWith(".apps.googleusercontent.com")) {
    errors.push("YOUTUBE_CLIENT_ID is missing or not a valid Google OAuth client ID.");
  }
  if (!clientSecret || clientSecret.length < 10 || /\s/.test(clientSecret)) {
    errors.push("YOUTUBE_CLIENT_SECRET is missing or looks invalid.");
  }
  if (!refreshToken || refreshToken.length < 10 || /\s/.test(refreshToken)) {
    errors.push(
      "YOUTUBE_REFRESH_TOKEN is missing or looks invalid. Run `node scripts/get-youtube-token.mjs` to generate one."
    );
  }

  return errors.length ? { ok: false, errors } : { ok: true, errors: [] };
}

export function assertYoutubeEnv() {
  const result = validateYoutubeEnv();
  if (!result.ok) {
    throw new ConfigError(result.errors);
  }
}
