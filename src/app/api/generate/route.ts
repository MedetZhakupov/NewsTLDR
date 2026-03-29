import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { Redis } from "@upstash/redis";
import { deductCredit } from "@/lib/credits";
import { saveGeneration } from "@/lib/db";
import { getGenerationLimiter } from "@/lib/ratelimit";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const PLATFORMS = ["Instagram", "LinkedIn", "TikTok", "Twitter/X", "Facebook"];
const VALID_TONES = ["professional", "casual", "witty", "bold", "inspirational"];
const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB decoded

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: "Use a polished, professional tone. Focus on credibility, value, and clear messaging.",
  casual: "Use a relaxed, conversational tone. Write like you're talking to a friend.",
  witty: "Use a clever, humorous tone. Include wordplay, jokes, or unexpected twists.",
  bold: "Use a confident, attention-grabbing tone. Be direct, provocative, and unapologetic.",
  inspirational: "Use an uplifting, motivational tone. Inspire action and positive emotion.",
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit
  const { success } = await getGenerationLimiter().limit(userId);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const { image, mediaType, tone } = await req.json();

    if (!image || !mediaType) {
      return NextResponse.json(
        { error: "Image and media type are required" },
        { status: 400 }
      );
    }

    // Validate media type against allowlist
    if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
      return NextResponse.json(
        { error: "Unsupported image format. Allowed: JPEG, PNG, GIF, WebP." },
        { status: 400 }
      );
    }

    // Validate base64 payload size (base64 is ~4/3 of original)
    const estimatedBytes = Math.ceil((image.length * 3) / 4);
    if (estimatedBytes > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Image too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const selectedTone = VALID_TONES.includes(tone) ? tone : "casual";
    const toneInstruction = TONE_INSTRUCTIONS[selectedTone];

    // Deduct credit before generation (fails if 0 credits)
    let remainingCredits: number;
    try {
      remainingCredits = await deductCredit(userId);
    } catch {
      return NextResponse.json(
        { error: "No credits remaining. Please purchase more." },
        { status: 402 }
      );
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: image,
              },
            },
            {
              type: "text",
              text: `You are a social media expert. Analyze this screenshot and generate one optimized caption for each of these platforms: ${PLATFORMS.join(", ")}.

Tone: ${toneInstruction}

Each caption must:
- Match the platform's style and character norms while maintaining the requested tone
- Include relevant hashtags where appropriate (Instagram, TikTok)
- Be engaging, authentic, and ready to copy-paste
- Capture the key message/vibe of the screenshot

Respond ONLY with valid JSON in this exact format, no markdown:
{
  "captions": [
    { "platform": "Instagram", "caption": "...", "charCount": 0 },
    { "platform": "LinkedIn", "caption": "...", "charCount": 0 },
    { "platform": "TikTok", "caption": "...", "charCount": 0 },
    { "platform": "Twitter/X", "caption": "...", "charCount": 0 },
    { "platform": "Facebook", "caption": "...", "charCount": 0 }
  ],
  "summary": "One sentence describing what the image shows"
}`,
            },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const parsed = JSON.parse(text);

    parsed.captions = parsed.captions.map(
      (c: { platform: string; caption: string }) => ({
        ...c,
        charCount: c.caption.length,
      })
    );

    await saveGeneration(userId, parsed.summary, parsed.captions);

    // Increment global generation counter (fire-and-forget)
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    redis.incr("stats:generations").catch(() => {});

    return NextResponse.json({ ...parsed, credits: remainingCredits });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate captions. Please try again." },
      { status: 500 }
    );
  }
}
