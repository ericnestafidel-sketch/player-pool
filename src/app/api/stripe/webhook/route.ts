import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { fulfillCheckoutSession, getStripe } from "@/lib/stripe-billing";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!stripe || !secret) return new Response("Payments are not configured.", { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature.", { status: 400 });
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return new Response("Invalid signature.", { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    try {
      await fulfillCheckoutSession(event.data.object);
      revalidatePath("/parent");
      revalidatePath("/coach/search");
    } catch (error) {
      console.error("Checkout webhook failed", error instanceof Error ? error.name : "");
      return new Response("Could not save the listing.", { status: 500 });
    }
  }
  return new Response("ok");
}
