"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { saveCoachChecklist, saveInfoRequest, setCoachStatus } from "@/lib/accounts";
import { clerkSaysAdmin, getRequestViewer } from "@/lib/viewer";

async function requireAdminId(): Promise<string> {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role === "admin" || (await clerkSaysAdmin(viewer.userId))) return viewer.userId;
  redirect("/");
}

function coachId(formData: FormData): string {
  const value = formData.get("coachId");
  return typeof value === "string" ? value.trim() : "";
}

export async function updateCoachStatus(formData: FormData) {
  const adminId = await requireAdminId();
  const status = formData.get("status");
  if (status !== "approved" && status !== "denied" && status !== "suspended") return;
  const reason = formData.get("reason");
  await setCoachStatus({
    adminId,
    coachId: coachId(formData),
    status,
    reason: typeof reason === "string" ? reason.trim() : "",
  });
  revalidatePath("/admin");
}

export async function updateChecklist(formData: FormData) {
  await requireAdminId();
  await saveCoachChecklist({
    coachId: coachId(formData),
    teamPage: formData.get("teamPage") === "on",
    org: formData.get("org") === "on",
  });
  revalidatePath("/admin");
}

export async function askForInfo(formData: FormData) {
  await requireAdminId();
  const note = formData.get("note");
  await saveInfoRequest({
    coachId: coachId(formData),
    note: typeof note === "string" ? note : "",
  });
  revalidatePath("/admin");
}
