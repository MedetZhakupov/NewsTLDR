import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const COUNTER_KEY = "stats:generations";

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

export async function GET() {
  try {
    const redis = getRedis();
    const count = (await redis.get<number>(COUNTER_KEY)) || 0;
    return NextResponse.json({ generations: count });
  } catch {
    return NextResponse.json({ generations: 0 });
  }
}
