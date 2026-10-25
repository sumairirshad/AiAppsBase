const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:5080";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? "";

export class BackendRequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function callBackend<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Api-Key": ADMIN_API_KEY,
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.text();
    throw new BackendRequestError(response.status, body || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
