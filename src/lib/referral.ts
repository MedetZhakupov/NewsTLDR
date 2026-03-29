import { Redis } from "@upstash/redis";
import { addCredits } from "@/lib/credits";

const REFERRAL_BONUS = 5;

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

function referralCodeKey(code: string) {
  return `referral:code:${code}`;
}

function userReferralKey(userId: string) {
  return `referral:user:${userId}`;
}

function referralUsedKey(userId: string) {
  return `referral:used:${userId}`;
}

export async function getReferralCode(userId: string): Promise<string> {
  const redis = getRedis();
  const existing = await redis.get<string>(userReferralKey(userId));
  if (existing) return existing;

  // Generate a short referral code
  const code = crypto.randomUUID().slice(0, 8);
  await redis.set(referralCodeKey(code), userId);
  await redis.set(userReferralKey(userId), code);
  return code;
}

export async function redeemReferral(
  newUserId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const redis = getRedis();

  // Check if this user already used a referral
  const alreadyUsed = await redis.get<string>(referralUsedKey(newUserId));
  if (alreadyUsed) {
    return { success: false, error: "Referral already used" };
  }

  // Look up the referrer
  const referrerId = await redis.get<string>(referralCodeKey(code));
  if (!referrerId) {
    return { success: false, error: "Invalid referral code" };
  }

  // Can't refer yourself
  if (referrerId === newUserId) {
    return { success: false, error: "Cannot use your own referral code" };
  }

  // Award credits to both users
  await addCredits(newUserId, REFERRAL_BONUS);
  await addCredits(referrerId, REFERRAL_BONUS);

  // Mark referral as used for this new user
  await redis.set(referralUsedKey(newUserId), referrerId);

  return { success: true };
}
