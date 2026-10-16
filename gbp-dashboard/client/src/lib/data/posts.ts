import { postsApi } from "@/lib/api/posts-api";
import { readLocalValue, writeLocalValue } from "@/lib/local-store";
import { Post, PostDraft } from "@/types/post";

interface PostOverrides {
  created: Post[];
  updated: Record<string, Post>;
  deletedIds: string[];
}

const OVERRIDES_KEY = "post-overrides";

function readOverrides(): PostOverrides {
  return (
    readLocalValue<PostOverrides>(OVERRIDES_KEY) ?? {
      created: [],
      updated: {},
      deletedIds: [],
    }
  );
}

function writeOverrides(overrides: PostOverrides): void {
  writeLocalValue(OVERRIDES_KEY, overrides);
}

function createId(): string {
  return `post-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export async function getPosts(): Promise<Post[]> {
  const seedPosts = await postsApi.getAll();
  const overrides = readOverrides();

  const merged = seedPosts
    .filter((post) => !overrides.deletedIds.includes(post.id))
    .map((post) => overrides.updated[post.id] ?? post);

  const createdPosts = overrides.created.filter(
    (post) => !overrides.deletedIds.includes(post.id)
  );

  return [...createdPosts, ...merged].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function createPost(draft: PostDraft): Promise<Post> {
  const now = new Date().toISOString();
  const post: Post = {
    ...draft,
    id: createId(),
    createdAt: now,
    updatedAt: now,
  };

  const overrides = readOverrides();
  overrides.created.push(post);
  writeOverrides(overrides);
  return post;
}

export async function updatePost(id: string, draft: PostDraft): Promise<Post> {
  const now = new Date().toISOString();
  const overrides = readOverrides();

  const createdIndex = overrides.created.findIndex((post) => post.id === id);
  if (createdIndex !== -1) {
    const updated: Post = {
      ...overrides.created[createdIndex],
      ...draft,
      updatedAt: now,
    };
    overrides.created[createdIndex] = updated;
    writeOverrides(overrides);
    return updated;
  }

  const existing = overrides.updated[id];
  const seedPosts = await postsApi.getAll();
  const seedPost = seedPosts.find((post) => post.id === id);
  const base = existing ?? seedPost;

  if (!base) {
    throw new Error(`Post ${id} not found`);
  }

  const updated: Post = { ...base, ...draft, id, updatedAt: now };
  overrides.updated[id] = updated;
  writeOverrides(overrides);
  return updated;
}

export async function deletePost(id: string): Promise<void> {
  const overrides = readOverrides();
  overrides.created = overrides.created.filter((post) => post.id !== id);
  delete overrides.updated[id];
  if (!overrides.deletedIds.includes(id)) {
    overrides.deletedIds.push(id);
  }
  writeOverrides(overrides);
}

export async function schedulePost(
  id: string,
  scheduledAt: string
): Promise<Post> {
  return updatePostStatus(id, "Scheduled", { scheduledAt, publishedAt: null });
}

export async function publishPostNow(id: string): Promise<Post> {
  return updatePostStatus(id, "Published", {
    publishedAt: new Date().toISOString(),
  });
}

async function updatePostStatus(
  id: string,
  status: Post["status"],
  fields: Partial<Post>
): Promise<Post> {
  const posts = await getPosts();
  const current = posts.find((post) => post.id === id);

  if (!current) {
    throw new Error(`Post ${id} not found`);
  }

  return updatePost(id, { ...toDraft(current), ...fields, status });
}

function toDraft(post: Post): PostDraft {
  return {
    type: post.type,
    status: post.status,
    title: post.title,
    body: post.body,
    imageUrl: post.imageUrl,
    actionButtonLabel: post.actionButtonLabel,
    actionButtonUrl: post.actionButtonUrl,
    eventStartAt: post.eventStartAt,
    eventEndAt: post.eventEndAt,
    offerCode: post.offerCode,
    offerValidUntil: post.offerValidUntil,
    scheduledAt: post.scheduledAt,
    publishedAt: post.publishedAt,
  };
}
