"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parsePlayerForm } from "@/lib/player-rules";
import { saveParentPlayer, setPlayerPaused, softDeletePlayer } from "@/lib/player-store";
import { listSports } from "@/lib/sport";
import { getRequestViewer } from "@/lib/viewer";

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
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role !== "parent") redirect("/parent");
  return viewer.userId;
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
  const result = await saveParentPlayer(id, parsed.value, existingId || undefined);
  if (!result.ok) return { error: result.error, fieldErrors: {} };
  refreshPlayer(result.id);
  if (!existingId) redirect(`/parent/player/${result.id}`);
  return { ok: true, fieldErrors: {} };
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
