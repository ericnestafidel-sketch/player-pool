"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { blockCoach, replyToRequest, reportCoach, unblockCoach } from "@/lib/threads";
import { getRequestViewer } from "@/lib/viewer";

export type MessageState = { error?: string };

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function safeReturn(value: string): string {
  const path = value.trim();
  const allowed =
    path === "/parent" ||
    path.startsWith("/parent/inbox/") ||
    path.startsWith("/parent/player/") ||
    path.startsWith("/players/");
  if (!allowed || path.includes("://") || path.startsWith("//") || path.includes("\\")) {
    return "/parent/inbox";
  }
  return path;
}

async function parentId(): Promise<string> {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role !== "parent") redirect("/parent");
  return viewer.userId;
}

export async function replyAsParent(
  _previous: MessageState,
  formData: FormData,
): Promise<MessageState> {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role !== "parent") redirect("/parent");
  const requestId = text(formData.get("requestId")).trim();
  const result = await replyToRequest(viewer, requestId, text(formData.get("body")));
  if (!result.ok) return { error: result.error };
  revalidatePath("/parent/inbox");
  revalidatePath(`/parent/inbox/${requestId}`);
  revalidatePath("/coach/messages");
  revalidatePath(`/coach/messages/${requestId}`);
  redirect(`/parent/inbox/${requestId}`);
}

export async function blockThisCoach(formData: FormData) {
  const id = await parentId();
  const coachId = text(formData.get("coachId")).trim();
  await blockCoach(id, coachId);
  revalidatePath("/coach/search");
  revalidatePath("/parent");
  revalidatePath("/parent/inbox");
  redirect(safeReturn(text(formData.get("returnTo"))));
}

export async function unblockThisCoach(formData: FormData) {
  const id = await parentId();
  const coachId = text(formData.get("coachId")).trim();
  await unblockCoach(id, coachId);
  revalidatePath("/coach/search");
  revalidatePath("/parent");
  revalidatePath("/parent/inbox");
  redirect(safeReturn(text(formData.get("returnTo"))));
}

export async function reportThisCoach(
  _previous: MessageState,
  formData: FormData,
): Promise<MessageState> {
  const id = await parentId();
  const coachId = text(formData.get("coachId")).trim();
  const result = await reportCoach(id, coachId, text(formData.get("reason")));
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin");
  revalidatePath("/coach/search");
  revalidatePath("/coach/messages");
  revalidatePath("/parent");
  revalidatePath("/parent/inbox");
  redirect(safeReturn(text(formData.get("returnTo"))));
}
