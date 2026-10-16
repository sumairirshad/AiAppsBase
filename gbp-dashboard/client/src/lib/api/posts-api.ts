import { httpClient } from "@/lib/api/http-client";
import { Post } from "@/types/post";

export const postsApi = {
  getAll: () => httpClient.get<Post[]>("/api/posts"),
};
