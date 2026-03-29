import { auth } from "@clerk/nextjs/server";
import { getReferralCode, redeemReferral } from "@/lib/referral";
import { getReadLimiter } from "@/lib/ratelimit";
import { NextRequest, NextResponse } from "next/server";

// GET — get or create referral code for current user
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await getReadLimiter().limit(userId);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  const code = await getReferralCode(userId);
  return NextResponse.json({ code });
}

// POST — redeem a referral code
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await getReadLimiter().limit(userId);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const result = await redeemReferral(userId, code.trim());
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, creditsAdded: 5 });
  } catch {
    return NextResponse.json(
      { error: "Failed to redeem referral" },
      { status: 500 }
    );
  }
}
