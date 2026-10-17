const cache = new Map<string, string>();

export function setLocalMediaUrl(id: string, url: string): void {
  cache.set(id, url);
}

export function getLocalMediaUrl(id: string): string | undefined {
  return cache.get(id);
}
