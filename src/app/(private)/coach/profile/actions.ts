"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateCoachTeamCard, type FieldErrors } from "@/lib/accounts";
import { getRequestViewer } from "@/lib/viewer";

export type CoachProfileState = {
  error?: string;
  ok?: boolean;
  fieldErrors: FieldErrors;
};

export async function updateCoachProfile(
  _previous: CoachProfileState,
  formData: FormData,
): Promise<CoachProfileState> {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  const result = await updateCoachTeamCard(viewer, formData);
  if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors };
  revalidatePath("/coach/profile");
  revalidatePath("/parent/inbox");
  return { ok: true, fieldErrors: {} };
}
