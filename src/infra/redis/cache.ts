import { redis } from "./client";

export async function cacheGetJson<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function cacheSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number
) {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

// Cache-aside mechanism
export async function cacheGetOrSetJson<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<{ value: T; hit: boolean }> {
  const cached = await cacheGetJson<T>(key);
  if (cached !== null) return { value: cached, hit: true };

  const value = await fetcher();
  await cacheSetJson(key, value, ttlSeconds);
  return { value, hit: false };
}
