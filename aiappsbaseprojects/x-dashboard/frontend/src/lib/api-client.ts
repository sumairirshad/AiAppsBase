import { API_BASE_URL } from "@/lib/api-config";
import type {
  ConnectionStatus,
  CreatePostRequest,
  CreateScheduledPostRequest,
  CreateShortRequest,
  DashboardSummary,
  MediaUploadResult,
  PremiumStatus,
  Post,
  Profile,
  ScheduledPost,
  Short,
  UpdateProfileRequest,
  UpdateScheduledPostRequest,
} from "@/lib/types";

class ApiError extends Error {
  status: number;
  code?: string;
  retryAfterSeconds?: number | null;

  constructor(status: number, message: string, code?: string, retryAfterSeconds?: number | null) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      body?.message ?? response.statusText,
      body?.code,
      body?.retryAfterSeconds
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const connectionApi = {
  getStatus: () => request<ConnectionStatus>("/api/auth/x/status"),
  loginUrl: () => `${API_BASE_URL}/api/auth/x/login`,
  logout: () => request<void>("/api/auth/x/logout", { method: "POST" }),
};

export const mediaApi = {
  upload: (file: File, kind: "image" | "video") => {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    return request<MediaUploadResult>("/api/media", { method: "POST", body: form });
  },
};

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
  uploadPicture: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ profilePictureUrl: string }>("/api/profile/picture", { method: "POST", body: form });
  },
  uploadBanner: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ coverImageUrl: string }>("/api/profile/banner", { method: "POST", body: form });
  },
};

export const postsApi = {
  list: () => request<Post[]>("/api/posts"),
  get: (id: string) => request<Post>(`/api/posts/${id}`),
  create: (payload: CreatePostRequest) =>
    request<Post>("/api/posts", {
      method: "POST",
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
