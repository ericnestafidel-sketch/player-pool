import { and, desc, eq, gte, inArray } from "drizzle-orm";
import Stripe from "stripe";
import { players, profileViews, subscriptions } from "@/db/schema";
import { getDb } from "@/db";
import { isPlayerId } from "@/lib/player-access";
import { coverageFor, promoFreeSeasonForPlayer, refundEligible } from "@/lib/seasons";

export const SEASON_PRICE_LOOKUP = "player_pool_season";
export const YEARLY_PRICE_LOOKUP = "player_pool_yearly";

export function stripeConfigured(): boolean {
  return Boolean(process.env["STRIPE_SECRET_KEY"]);
}

export function getStripe(): Stripe | null {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) return null;
  return new Stripe(key);
}

export function requestOrigin(headerStore: { get(name: string): string | null }): string {
  const configured = process.env["APP_URL"]?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  if (!host) return "";
  return `${proto}://${host}`;
}

export async function priceIdForPlan(plan: "season" | "yearly"): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;
  const lookup = plan === "season" ? SEASON_PRICE_LOOKUP : YEARLY_PRICE_LOOKUP;
  const prices = await stripe.prices.list({ lookup_keys: [lookup], active: true, limit: 1 });
  return prices.data[0]?.id ?? null;
}

export async function createCheckoutSession(input: {
  parentId: string;
  playerId: string;
  plan: "season" | "yearly";
  startSeason: string;
  email: string | null;
  origin: string;
  allowPromotionCodes?: boolean;
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const stripe = getStripe();
  if (!stripe) return { ok: false, error: "Payments coming soon." };
  if (!input.origin) return { ok: false, error: "Payments coming soon." };
  const price = await priceIdForPlan(input.plan);
  if (!price) {
    return { ok: false, error: "Payments coming soon. Stripe prices are not set up yet." };
  }
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price, quantity: 1 }],
    allow_promotion_codes: input.allowPromotionCodes !== false,
    customer_email: input.email ?? undefined,
    success_url: `${input.origin}/parent/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/parent/checkout`,
    metadata: {
      parent_id: input.parentId,
      player_id: input.playerId,
      plan: input.plan,
      start_season: input.startSeason,
      admin_test: input.allowPromotionCodes === false ? "true" : "false",
    },
    consent_collection: { terms_of_service: "required" },
    custom_text: {
      terms_of_service_acceptance: {
        message:
          "I agree to the Player Pool Terms of Use. Full refund within 15 days of payment only if no coach has opened the profile; otherwise no refund.",
      },
    },
  });
  if (!session.url) return { ok: false, error: "Stripe did not return a checkout page." };
  return { ok: true, url: session.url };
}

export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<"created" | "exists" | "ignored"> {
  if (session.mode !== "payment") return "ignored";
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return "ignored";
  }
  const parentId = session.metadata?.parent_id ?? "";
  const playerId = session.metadata?.player_id ?? "";
  const plan = session.metadata?.plan;
  if (!parentId || !isPlayerId(playerId) || (plan !== "season" && plan !== "yearly")) return "ignored";
  const db = getDb();
  if (!db) throw new Error("Database is not configured.");
  const [player] = await db
    .select({ parentId: players.parentId, adminTest: players.adminTest })
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);
  if (!player || player.parentId !== parentId) return "ignored";

  const now = new Date();
  const amount = session.amount_total ?? 0;
  const discount = session.total_details?.amount_discount ?? 0;
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;
  const coverage = coverageFor(session.metadata?.start_season ?? "", plan, now);
  if (!coverage) return "ignored";
  const year = Number(coverage.seasonCode.split("-").at(-1));
  try {
    await db.insert(subscriptions).values({
      parentId,
      playerId,
      plan,
      seasonCode: coverage.seasonCode,
      year: Number.isInteger(year) ? year : now.getFullYear(),
      amountCents: amount,
      promoFreeSeason: promoFreeSeasonForPlayer(player.adminTest, amount, discount),
      stripeSessionId: session.id,
      stripePaymentIntent: paymentIntent,
      paidAt: now,
      expiresAt: coverage.expiresAt,
    });
  } catch {
    const [existing] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.stripeSessionId, session.id))
      .limit(1);
    if (existing) return "exists";
    throw new Error("Could not save the listing.");
  }
  await db
    .update(players)
    .set({
      season: plan === "yearly" ? `yearly:${coverage.seasonCode}` : coverage.seasonCode,
      updatedAt: now,
    })
    .where(eq(players.id, playerId));
  return "created";
}

export type PlayerListing = {
  subscriptionId: string | null;
  active: boolean;
  expiresAt: Date | null;
  paidAt: Date | null;
  amountCents: number | null;
  promoFreeSeason: boolean;
  plan: "season" | "yearly" | null;
  refundable: boolean;
};

export async function listingsForParent(parentId: string, now = new Date()): Promise<Map<string, PlayerListing>> {
  const result = new Map<string, PlayerListing>();
  const db = getDb();
  if (!db) return result;
  const rows = await db
    .select({
      id: subscriptions.id,
      playerId: subscriptions.playerId,
      plan: subscriptions.plan,
      amountCents: subscriptions.amountCents,
      promoFreeSeason: subscriptions.promoFreeSeason,
      stripePaymentIntent: subscriptions.stripePaymentIntent,
      paidAt: subscriptions.paidAt,
      expiresAt: subscriptions.expiresAt,
    })
    .from(subscriptions)
    .where(eq(subscriptions.parentId, parentId))
    .orderBy(desc(subscriptions.expiresAt));
  const chosen = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!row.paidAt) continue;
    const current = chosen.get(row.playerId);
    if (!current) chosen.set(row.playerId, row);
  }
  const playerIds = [...chosen.keys()];
  const viewRows =
    playerIds.length === 0
      ? []
      : await db
          .select({ playerId: profileViews.playerId, viewedAt: profileViews.viewedAt })
          .from(profileViews)
          .where(inArray(profileViews.playerId, playerIds));
  for (const [playerId, row] of chosen) {
    const views =
      row.paidAt == null
        ? 0
        : viewRows.filter((view) => view.playerId === playerId && view.viewedAt >= row.paidAt!).length;
    const active = Boolean(row.paidAt && row.expiresAt && row.expiresAt > now);
    result.set(playerId, {
      subscriptionId: row.id,
      active,
      expiresAt: row.expiresAt,
      paidAt: row.paidAt,
      amountCents: row.amountCents,
      promoFreeSeason: row.promoFreeSeason,
      plan: row.plan,
      refundable: refundEligible({
        paidAt: row.paidAt,
        expiresAt: row.expiresAt,
        amountCents: row.amountCents,
        paymentIntent: row.stripePaymentIntent,
        viewsSincePayment: views,
        now,
      }),
    });
  }
  return result;
}

export async function refundListing(
  parentId: string,
  subscriptionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const stripe = getStripe();
  const db = getDb();
  if (!stripe || !db) return { ok: false, error: "Payments coming soon." };
  if (!isPlayerId(subscriptionId)) return { ok: false, error: "That listing is not available." };
  const [row] = await db
    .select({
      id: subscriptions.id,
      parentId: subscriptions.parentId,
      playerId: subscriptions.playerId,
      amountCents: subscriptions.amountCents,
      stripePaymentIntent: subscriptions.stripePaymentIntent,
      paidAt: subscriptions.paidAt,
      expiresAt: subscriptions.expiresAt,
    })
    .from(subscriptions)
    .where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.parentId, parentId)))
    .limit(1);
  if (!row) return { ok: false, error: "That listing is not available." };
  const [view] = row.paidAt
    ? await db
        .select({ id: profileViews.id })
        .from(profileViews)
        .where(and(eq(profileViews.playerId, row.playerId), gte(profileViews.viewedAt, row.paidAt)))
        .limit(1)
    : [];
  const eligible = refundEligible({
    paidAt: row.paidAt,
    expiresAt: row.expiresAt,
    amountCents: row.amountCents,
    paymentIntent: row.stripePaymentIntent,
    viewsSincePayment: view ? 1 : 0,
    now: new Date(),
  });
  if (!eligible || !row.stripePaymentIntent) return { ok: false, error: "This listing cannot be refunded." };
  try {
    await stripe.refunds.create(
      { payment_intent: row.stripePaymentIntent },
      { idempotencyKey: `listing-refund-${row.id}` },
    );
  } catch (error) {
    const already =
      error instanceof Stripe.errors.StripeError &&
      (error.code === "charge_already_refunded" || error.code === "payment_intent_unexpected_state");
    if (!already) return { ok: false, error: "Stripe could not refund this payment." };
  }
  await db
    .update(subscriptions)
    .set({ expiresAt: new Date() })
    .where(eq(subscriptions.id, row.id));
  return { ok: true };
}
