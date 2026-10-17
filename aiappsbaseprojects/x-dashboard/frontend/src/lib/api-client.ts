import { API_BASE_URL } from "@/lib/api-config";
import type {
  CreatePostRequest,
  CreateScheduledPostRequest,
  CreateShortRequest,
  DashboardSummary,
  PremiumStatus,
  Post,
  Profile,
  ScheduledPost,
  Short,
  UpdatePostRequest,
  UpdateProfileRequest,
  UpdateScheduledPostRequest,
} from "@/lib/types";

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.message ?? response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const dashboardApi = {
  getSummary: () => request<DashboardSummary>("/api/dashboard/summary"),
};

export const profileApi = {
  get: () => request<Profile>("/api/profile"),
  update: (payload: UpdateProfileRequest) =>
    request<Profile>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};

export const postsApi = {
  list: () => request<Post[]>("/api/posts"),
  get: (id: string) => request<Post>(`/api/posts/${id}`),
  create: (payload: CreatePostRequest) =>
    request<Post>("/api/posts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: UpdatePostRequest) =>
    request<Post>(`/api/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    request<void>(`/api/posts/${id}`, { method: "DELETE" }),
  pin: (id: string) =>
    request<Post>(`/api/posts/${id}/pin`, { method: "POST" }),
};

export const shortsApi = {
  list: () => request<Short[]>("/api/shorts"),
  create: (payload: CreateShortRequest) =>
    request<Short>("/api/shorts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    request<void>(`/api/shorts/${id}`, { method: "DELETE" }),
};

export const schedulerApi = {
  list: () => request<ScheduledPost[]>("/api/scheduler"),
  create: (payload: CreateScheduledPostRequest) =>
    request<ScheduledPost>("/api/scheduler", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: UpdateScheduledPostRequest) =>
    request<ScheduledPost>(`/api/scheduler/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  cancel: (id: string) =>
    request<void>(`/api/scheduler/${id}`, { method: "DELETE" }),
  publishNow: (id: string) =>
    request<ScheduledPost>(`/api/scheduler/${id}/publish-now`, {
      method: "POST",
    }),
};

export const premiumApi = {
  getStatus: () => request<PremiumStatus>("/api/premium/status"),
};

export { ApiError };
