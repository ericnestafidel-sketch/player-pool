"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and, isNull } from "drizzle-orm";
import { players, users } from "@/db/schema";
import { getDb } from "@/db";
import { isPlayerId } from "@/lib/player-access";
import { createCheckoutSession, refundListing, requestOrigin, stripeConfigured } from "@/lib/stripe-billing";
import { getRequestViewer } from "@/lib/viewer";

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

async function parentId(): Promise<string> {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role !== "parent") redirect("/parent");
  return viewer.userId;
}

export async function startCheckout(formData: FormData) {
  const id = await parentId();
  if (!stripeConfigured()) redirect("/parent/checkout");
  const playerId = text(formData.get("playerId"));
  const plan = text(formData.get("plan"));
  if (!isPlayerId(playerId) || (plan !== "season" && plan !== "yearly")) redirect("/parent/checkout");
  const db = getDb();
  if (!db) redirect("/parent/checkout");
  const [player] = await db
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.id, playerId), eq(players.parentId, id), isNull(players.deletedAt)))
    .limit(1);
  if (!player) redirect("/parent/checkout");
  const [account] = await db.select({ email: users.email }).from(users).where(eq(users.id, id)).limit(1);
  const origin = requestOrigin(await headers());
  const session = await createCheckoutSession({
    parentId: id,
    playerId,
    plan,
    email: account?.email ?? null,
    origin,
  });
  if (!session.ok || !session.url) redirect("/parent/checkout?notice=soon");
  redirect(session.url);
}

export async function requestRefund(formData: FormData) {
  const id = await parentId();
  await refundListing(id, text(formData.get("subscriptionId")));
  revalidatePath("/parent");
  revalidatePath("/coach/search");
  redirect("/parent");
}
