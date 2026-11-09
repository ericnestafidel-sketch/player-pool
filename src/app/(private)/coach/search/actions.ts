"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canReadPlayer } from "@/lib/player-access";
import { filtersFromParams, type SearchFilters } from "@/lib/player-rules";
import { deleteSavedSearch, recordCoachView, saveCoachNote, saveCoachSearch } from "@/lib/player-store";
import { listSports, preferredSport } from "@/lib/sport";
import { getRequestViewer } from "@/lib/viewer";

export type NoteState = { ok: boolean; error?: string };
export type SaveSearchState = { ok: boolean; error?: string };

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

async function approvedCoachId(): Promise<string> {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role !== "coach" || viewer.coachStatus !== "approved") {
    redirect(viewer.role === "coach" ? "/coach/pending" : "/access-denied");
  }
  return viewer.userId;
}

export async function saveNote(_previous: NoteState, formData: FormData): Promise<NoteState> {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role !== "coach" || viewer.coachStatus !== "approved") {
    return { ok: false, error: "Approved coaches can save notes." };
  }
  const playerId = text(formData.get("playerId")).trim();
  if (!(await canReadPlayer(viewer, playerId))) {
    return { ok: false, error: "That profile is not available." };
  }
  const result = await saveCoachNote(viewer.userId, playerId, text(formData.get("body")));
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/coach/search");
  revalidatePath(`/players/${playerId}`);
  return { ok: true };
}

export async function recordProfileView(playerId: string): Promise<void> {
  const viewer = await getRequestViewer();
  if (!viewer || viewer.role !== "coach" || viewer.coachStatus !== "approved") return;
  if (!(await canReadPlayer(viewer, playerId))) return;
  await recordCoachView(viewer.userId, playerId);
}

export async function saveSearch(
  _previous: SaveSearchState,
  formData: FormData,
): Promise<SaveSearchState> {
  const coachId = await approvedCoachId();
  const sports = await listSports();
  const filters: SearchFilters = filtersFromParams(
    {
      age: text(formData.get("age")),
      position: text(formData.get("position")),
      level: text(formData.get("level")),
      state: text(formData.get("state")),
      county: text(formData.get("county")),
      weekend: text(formData.get("weekend")),
      status: text(formData.get("status")),
    },
    preferredSport(sports),
    new Date(),
  );
  const result = await saveCoachSearch(coachId, text(formData.get("name")), filters);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/coach/search");
  return { ok: true };
}

export async function removeSavedSearch(formData: FormData) {
  const coachId = await approvedCoachId();
  await deleteSavedSearch(coachId, text(formData.get("searchId")).trim());
  revalidatePath("/coach/search");
}
