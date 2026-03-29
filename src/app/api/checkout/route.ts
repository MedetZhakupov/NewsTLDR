import { auth } from "@clerk/nextjs/server";
import { getStripe, CREDIT_PACKAGES } from "@/lib/stripe";
import { getCheckoutLimiter } from "@/lib/ratelimit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit
  const { success } = await getCheckoutLimiter().limit(userId);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const { packageId } = await req.json();

    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `CaptionCraft — ${pkg.label}`,
              description: `${pkg.credits} caption generation credits`,
            },
            unit_amount: pkg.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.nextUrl.origin}/?purchased=true`,
      cancel_url: `${req.nextUrl.origin}/?canceled=true`,
      client_reference_id: userId,
      metadata: {
        userId,
        credits: pkg.credits.toString(),
        packageId: pkg.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Checkout error:", message);
    return NextResponse.json(
      { error: "Failed to create checkout session. Please try again." },
      { status: 500 }
    );
  }
}
