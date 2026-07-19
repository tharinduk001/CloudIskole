import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

import { serverEnv } from "@/lib/env";

/**
 * IP + action rate limiting on top of Upstash Redis.
 *
 * Upstash is optional in `serverEnv()` so the app boots in local dev without
 * it. When the credentials are absent, every check silently allows the
 * request — dev is not where credential-stuffing or SMS-credit draining
 * happens. Production must set the two `UPSTASH_*` vars for this to do
 * anything.
 */

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;

  const env = serverEnv();
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    redis = null;
    return redis;
  }

  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  return redis;
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;

  const cacheKey = `${bucket}:${limit}:${windowSeconds}`;
  const existing = limiters.get(cacheKey);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    prefix: `cloudiskole:${bucket}`,
    analytics: false,
  });
  limiters.set(cacheKey, limiter);
  return limiter;
}

/** Best-effort caller IP from the standard proxy header Vercel sets. */
export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

export type RateLimitResult =
  { allowed: true } | { allowed: false; retryAfterSeconds: number };

/**
 * Checks and consumes one unit of `bucket`'s quota for `identifier`.
 *
 * Fails open (allows the request) when Upstash is not configured, and also
 * fails open on a transient Upstash error — a rate limiter that can take the
 * whole site down when Redis hiccups is worse than one that occasionally
 * lets a burst through.
 */
export async function rateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const limiter = getLimiter(bucket, limit, windowSeconds);
  if (!limiter) return { allowed: true };

  try {
    const result = await limiter.limit(identifier);
    if (result.success) return { allowed: true };
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  } catch (error) {
    console.error(`rateLimit(${bucket}) failed, allowing request`, error);
    return { allowed: true };
  }
}
