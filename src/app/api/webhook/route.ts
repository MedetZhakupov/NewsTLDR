import { addCredits } from "@/lib/credits";
import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("Webhook: No stripe-signature header");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Webhook: STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    console.error(`Webhook signature verification failed: ${msg}`);
    return NextResponse.json(
      { error: "Signature verification failed" },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const credits = parseInt(session.metadata?.credits || "0", 10);

      console.log(`Webhook: checkout.session.completed — userId=${userId}, credits=${credits}`);

      if (userId && credits > 0) {
        await addCredits(userId, credits);
        console.log(`Webhook: Added ${credits} credits to user ${userId}`);
      } else {
        console.error(`Webhook: Missing userId or credits in metadata`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    console.error(`Webhook processing error: ${msg}`);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

