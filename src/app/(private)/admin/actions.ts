"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { saveCoachChecklist, saveInfoRequest, setCoachStatus, setFoundingCoach } from "@/lib/accounts";
import { moderateBoardPost } from "@/lib/board";
import { resolveReport } from "@/lib/threads";
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

export async function toggleFoundingCoach(formData: FormData) {
  await requireAdminId();
  const enabled = formData.get("founding") === "true";
  const result = await setFoundingCoach(coachId(formData), enabled);
  revalidatePath("/admin");
  revalidatePath("/coach/profile");
  revalidatePath("/coach/search");
  revalidatePath("/parent/inbox");
  if (!result.ok) redirect("/admin?notice=founding-full");
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

export async function reviewReport(formData: FormData) {
  const adminId = await requireAdminId();
  const decision = formData.get("decision");
  const reportId = formData.get("reportId");
  if ((decision !== "reinstate" && decision !== "keep") || typeof reportId !== "string") return;
  await resolveReport({ reportId: reportId.trim(), decision, adminId });
  revalidatePath("/admin");
  revalidatePath("/coach/search");
  revalidatePath("/coach/messages");
}

export async function moderatePost(formData: FormData) {
  await requireAdminId();
  const action = formData.get("action");
  const postId = formData.get("postId");
  if ((action !== "hide" && action !== "remove") || typeof postId !== "string") return;
  await moderateBoardPost(postId.trim(), action);
  revalidatePath("/admin");
  revalidatePath("/board");
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
