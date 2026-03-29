import { Redis } from "@upstash/redis";

interface CaptionItem {
  platform: string;
  caption: string;
  charCount: number;
}

export interface GenerationRecord {
  id: string;
  summary: string;
  captions: CaptionItem[];
  createdAt: string;
}

const MAX_HISTORY = 50;

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

function historyKey(userId: string) {
  return `history:${userId}`;
}

export async function saveGeneration(
  userId: string,
  summary: string,
  captions: CaptionItem[]
): Promise<GenerationRecord> {
  const redis = getRedis();
  const record: GenerationRecord = {
    id: crypto.randomUUID(),
    summary,
    captions,
    createdAt: new Date().toISOString(),
  };

  const key = historyKey(userId);
  // Prepend to list
  await redis.lpush(key, JSON.stringify(record));
  // Trim to max
  await redis.ltrim(key, 0, MAX_HISTORY - 1);

  return record;
}

export async function getGenerations(
  userId: string,
  limit = 20,
  offset = 0
): Promise<{ generations: GenerationRecord[]; total: number }> {
  const redis = getRedis();
  const key = historyKey(userId);

  const total = await redis.llen(key);
  const raw = await redis.lrange(key, offset, offset + limit - 1);

  const generations = raw.map((item) =>
    typeof item === "string" ? JSON.parse(item) : item
  ) as GenerationRecord[];

  return { generations, total };
}

export async function deleteGeneration(
  id: string,
  userId: string
): Promise<boolean> {
  const redis = getRedis();
  const key = historyKey(userId);

  // Find and remove the record
  const all = await redis.lrange(key, 0, -1);
  for (const item of all) {
    const record = typeof item === "string" ? JSON.parse(item) : item;
    if (record.id === id) {
      await redis.lrem(key, 1, typeof item === "string" ? item : JSON.stringify(item));
      return true;
    }
  }
  return false;
}
