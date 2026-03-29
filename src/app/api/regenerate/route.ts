import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { getRegenerateLimiter } from "@/lib/ratelimit";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const VALID_TONES = ["professional", "casual", "witty", "bold", "inspirational"];

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

  const { success } = await getRegenerateLimiter().limit(userId);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const { image, mediaType, platform, tone } = await req.json();

    if (!image || !mediaType || !platform) {
      return NextResponse.json(
        { error: "Image, media type, and platform are required" },
        { status: 400 }
      );
    }

    const selectedTone = VALID_TONES.includes(tone) ? tone : "casual";
    const toneInstruction = TONE_INSTRUCTIONS[selectedTone];

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
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
              text: `You are a social media expert. Analyze this screenshot and generate ONE optimized caption for ${platform}.

Tone: ${toneInstruction}

The caption must:
- Match ${platform}'s style and character norms while maintaining the requested tone
- Include relevant hashtags where appropriate
- Be engaging, authentic, and ready to copy-paste
- Capture the key message/vibe of the screenshot
- Be DIFFERENT from a typical caption — give a fresh, creative alternative

Respond ONLY with valid JSON, no markdown:
{ "platform": "${platform}", "caption": "...", "charCount": 0 }`,
            },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const parsed = JSON.parse(text);
    parsed.charCount = parsed.caption.length;

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Regenerate error:", error);
    return NextResponse.json(
      { error: "Failed to regenerate caption. Please try again." },
      { status: 500 }
    );
  }
}
