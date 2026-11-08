"use server";

import { redirect } from "next/navigation";
import { submitCoachApplication, type FieldErrors } from "@/lib/accounts";
import { getRequestViewer } from "@/lib/viewer";

export type CoachFormState = {
  error?: string;
  fieldErrors: FieldErrors;
};

export async function submitCoach(
  _previous: CoachFormState,
  formData: FormData,
): Promise<CoachFormState> {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/coach/sign-up");
  const result = await submitCoachApplication(viewer, formData);
  if (result.ok) redirect("/coach/pending");
  return { error: result.error, fieldErrors: result.fieldErrors };
}
