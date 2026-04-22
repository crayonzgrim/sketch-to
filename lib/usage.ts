import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

function getUsageKey(userId: string, date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `usage:${userId}:${year}-${month}-${day}`;
}

export async function getTodayUsage(userId: string): Promise<number> {
  try {
    const key = getUsageKey(userId);
    const count = await redis.get<number>(key);
    return count || 0;
  } catch (error) {
    console.error("Failed to get usage:", error);
    return 0;
  }
}

export async function checkUsageAllowed(userId: string): Promise<boolean> {
  try {
    const usage = await getTodayUsage(userId);
    return usage < 3;
  } catch (error) {
    console.error("Failed to check usage:", error);
    return true; // fail-open: allow on error
  }
}

export async function incrementUsage(userId: string): Promise<number> {
  try {
    const key = getUsageKey(userId);
    const count = await redis.incr(key);

    // Set expiry on first increment of the day
    if (count === 1) {
      await redis.expire(key, 86400); // 24 hours
    }

    return count;
  } catch (error) {
    console.error("Failed to increment usage:", error);
    throw error;
  }
}
