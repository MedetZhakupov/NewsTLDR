import { auth } from "@clerk/nextjs/server";
import { getGenerations, deleteGeneration } from "@/lib/db";
import { getReadLimiter } from "@/lib/ratelimit";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
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

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  const { generations, total } = await getGenerations(userId, limit, offset);

  const items = generations.map((g) => ({
    id: g.id,
    summary: g.summary,
    captions: g.captions,
    createdAt: g.createdAt,
  }));

  return NextResponse.json({ items, total });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  const deleted = await deleteGeneration(id, userId);

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
