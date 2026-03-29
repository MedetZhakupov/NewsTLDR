import { auth } from "@clerk/nextjs/server";
import { getCredits } from "@/lib/credits";
import { getReadLimiter } from "@/lib/ratelimit";
import { NextResponse } from "next/server";

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

  const credits = await getCredits(userId);
  return NextResponse.json({ credits });
}
