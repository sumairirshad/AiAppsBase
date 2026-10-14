// One-time local OAuth2 consent flow to mint a YOUTUBE_REFRESH_TOKEN.
//
// Run with: node scripts/get-youtube-token.mjs
// (set YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET in .env.local first, or
// pass them as env vars to this command)
//
// It starts a tiny local server, prints a Google consent URL for you to
// open in a browser, catches the redirect, and prints the refresh token to
// paste into .env.local as YOUTUBE_REFRESH_TOKEN.

import http from "http";
import { readFileSync } from "fs";
import { google } from "googleapis";

function loadDotEnvLocal() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf-8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim();
      }
    }
  } catch {
    // .env.local not found — rely on vars already in the environment
  }
}

loadDotEnvLocal();

const PORT = 42813;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const clientId = process.env.YOUTUBE_CLIENT_ID;
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "Missing YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET. Set them in .env.local first."
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/youtube"],
});

console.log("\nOpen this URL in a browser and approve access:\n");
console.log(authUrl);
console.log(`\nWaiting for the redirect on ${REDIRECT_URI} ...\n`);

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/oauth2callback")) {
    res.writeHead(404).end();
    return;
  }

  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");

  if (!code) {
    res.writeHead(400).end("No authorization code received.");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { "Content-Type": "text/html" }).end(
      "<p>Done — you can close this tab and return to the terminal.</p>"
    );
    console.log("\nAdd this to .env.local:\n");
    console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    if (!tokens.refresh_token) {
      console.log(
        "No refresh token was returned. If you've already authorized this app before, revoke access at https://myaccount.google.com/permissions and run this script again."
      );
    }
  } catch (err) {
    res.writeHead(500).end("Token exchange failed.");
    console.error("Token exchange failed:", err.message);
  } finally {
    server.close();
  }
});

server.listen(PORT);
