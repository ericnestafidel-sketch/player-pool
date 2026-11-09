"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { parents } from "@/db/schema";
import { getDb } from "@/db";
import { LEGAL_VERSION } from "@/lib/legal";
import { parsePlayerForm } from "@/lib/player-rules";
import { saveParentPlayer, setPlayerPaused, softDeletePlayer } from "@/lib/player-store";
import { listSports } from "@/lib/sport";
import { requireParentActor } from "@/lib/parent-actor";

export type PlayerFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors: Record<string, string>;
};

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function refreshPlayer(playerId: string) {
  revalidatePath("/parent");
  revalidatePath("/coach/search");
  revalidatePath(`/parent/player/${playerId}`);
  revalidatePath(`/players/${playerId}`);
}

async function parentId(): Promise<string> {
  return requireParentActor();
}

export async function savePlayer(
  _previous: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  const id = await parentId();
  const sports = await listSports();
  const parsed = parsePlayerForm(formData, sports, new Date());
  if (!parsed.ok) return { error: parsed.error, fieldErrors: parsed.fieldErrors };
  const existingId = text(formData.get("playerId"));
  if (!existingId) {
    const agreement = await recordFirstPlayerAgreement(id, formData.get("guardian") === "on");
    if (agreement) return { error: agreement, fieldErrors: { guardian: agreement } };
  }
  const result = await saveParentPlayer(id, parsed.value, existingId || undefined);
  if (!result.ok) return { error: result.error, fieldErrors: {} };
  refreshPlayer(result.id);
  if (!existingId) redirect(`/parent/player/${result.id}`);
  return { ok: true, fieldErrors: {} };
}

async function recordFirstPlayerAgreement(parentId: string, agreed: boolean): Promise<string | null> {
  const db = getDb();
  if (!db) return "Database is not configured yet.";
  const [parent] = await db
    .select({ termsAcceptedAt: parents.termsAcceptedAt })
    .from(parents)
    .where(eq(parents.userId, parentId))
    .limit(1);
  if (parent?.termsAcceptedAt) return null;
  if (!agreed) {
    return "Confirm you are 18 or older and this player's parent or guardian, and agree to the Terms and Privacy Policy.";
  }
  await db
    .update(parents)
    .set({ termsAcceptedAt: new Date(), termsVersion: LEGAL_VERSION })
    .where(eq(parents.userId, parentId));
  return null;
}

export async function pausePlayer(formData: FormData) {
  const id = await parentId();
  const playerId = text(formData.get("playerId"));
  const paused = formData.get("paused") === "true";
  const result = await setPlayerPaused(id, playerId, paused);
  if (!result.ok) redirect("/parent");
  refreshPlayer(playerId);
}

export async function deletePlayer(formData: FormData) {
  const id = await parentId();
  const playerId = text(formData.get("playerId"));
  await softDeletePlayer(id, playerId);
  revalidatePath("/parent");
  revalidatePath("/coach/search");
  revalidatePath(`/players/${playerId}`);
  redirect("/parent");
}
