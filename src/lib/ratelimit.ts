import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _generationLimiter: Ratelimit | null = null;
let _checkoutLimiter: Ratelimit | null = null;
let _regenerateLimiter: Ratelimit | null = null;
let _readLimiter: Ratelimit | null = null;

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

export function getGenerationLimiter(): Ratelimit {
  if (!_generationLimiter) {
    _generationLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      prefix: "ratelimit:generate",
    });
  }
  return _generationLimiter;
}

export function getRegenerateLimiter(): Ratelimit {
  if (!_regenerateLimiter) {
    _regenerateLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      prefix: "ratelimit:regenerate",
    });
  }
  return _regenerateLimiter;
}

export function getReadLimiter(): Ratelimit {
  if (!_readLimiter) {
    _readLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      prefix: "ratelimit:read",
    });
  }
  return _readLimiter;
}

export function getCheckoutLimiter(): Ratelimit {
  if (!_checkoutLimiter) {
    _checkoutLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      prefix: "ratelimit:checkout",
    });
  }
  return _checkoutLimiter;
}
