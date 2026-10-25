import "server-only";

const BACKEND_URL = process.env.INSTAGRAM_BACKEND_URL;
const ADMIN_API_KEY = process.env.INSTAGRAM_ADMIN_API_KEY;

export class BackendRequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function backendFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (!BACKEND_URL) {
    throw new Error("INSTAGRAM_BACKEND_URL is not configured on the server.");
  }
  if (!ADMIN_API_KEY) {
    throw new Error("INSTAGRAM_ADMIN_API_KEY is not configured on the server.");
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Api-Key": ADMIN_API_KEY,
      ...init.headers
    },
    cache: "no-store"
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = body?.message ?? `Backend request failed with status ${response.status}.`;
    throw new BackendRequestError(response.status, message);
  }

  return body as T;
}

export async function backendFetchAnonymous<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!BACKEND_URL) {
    throw new Error("INSTAGRAM_BACKEND_URL is not configured on the server.");
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
    cache: "no-store"
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = body?.message ?? `Backend request failed with status ${response.status}.`;
    throw new BackendRequestError(response.status, message);
  }

  return body as T;
}
