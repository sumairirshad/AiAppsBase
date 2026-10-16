import { httpClient } from "@/lib/api/http-client";
import { MediaItem } from "@/types/media";

export const mediaApi = {
  getAll: () => httpClient.get<MediaItem[]>("/api/media"),
};
