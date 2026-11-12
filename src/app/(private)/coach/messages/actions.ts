"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { blockParentThread, replyToRequest, reportParentThread, startContact, unblockParentThread } from "@/lib/threads";
import { getRequestViewer } from "@/lib/viewer";

export type MessageState = { error?: string };

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function sendContact(
  _previous: MessageState,
  formData: FormData,
): Promise<MessageState> {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  const result = await startContact(
    viewer,
    text(formData.get("playerId")).trim(),
    text(formData.get("weekend")).trim(),
    text(formData.get("body")),
  );
  if (!result.ok) return { error: result.error };
  revalidatePath("/parent/inbox");
  revalidatePath("/coach/messages");
  revalidatePath(`/players/${text(formData.get("playerId")).trim()}`);
  redirect(`/coach/messages/${result.requestId}`);
}

export async function replyAsCoach(
  _previous: MessageState,
  formData: FormData,
): Promise<MessageState> {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role !== "coach" || viewer.coachStatus !== "approved") {
    redirect(viewer.role === "coach" ? "/coach/pending" : "/access-denied");
  }
  const requestId = text(formData.get("requestId")).trim();
  const result = await replyToRequest(viewer, requestId, text(formData.get("body")));
  if (!result.ok) return { error: result.error };
  revalidatePath("/parent/inbox");
  revalidatePath(`/parent/inbox/${requestId}`);
  revalidatePath("/coach/messages");
  revalidatePath(`/coach/messages/${requestId}`);
  redirect(`/coach/messages/${requestId}`);
}

async function approvedCoachId(): Promise<string> {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role !== "coach" || viewer.coachStatus !== "approved") {
    redirect(viewer.role === "coach" ? "/coach/pending" : "/access-denied");
  }
  return viewer.userId;
}

export async function blockThisThread(formData: FormData) {
  const coachId = await approvedCoachId();
  const requestId = text(formData.get("requestId")).trim();
  await blockParentThread(coachId, requestId);
  revalidatePath("/coach/messages");
  revalidatePath(`/coach/messages/${requestId}`);
  revalidatePath("/parent/inbox");
  redirect(`/coach/messages/${requestId}`);
}

export async function unblockThisThread(formData: FormData) {
  const coachId = await approvedCoachId();
  const requestId = text(formData.get("requestId")).trim();
  await unblockParentThread(coachId, requestId);
  revalidatePath("/coach/messages");
  revalidatePath(`/coach/messages/${requestId}`);
  revalidatePath("/parent/inbox");
  redirect(`/coach/messages/${requestId}`);
}

export async function reportThisThread(formData: FormData) {
  const coachId = await approvedCoachId();
  const requestId = text(formData.get("requestId")).trim();
  const result = await reportParentThread(coachId, requestId, text(formData.get("reason")));
  revalidatePath("/admin");
  redirect(result.ok ? `/coach/messages/${requestId}` : `/coach/messages/${requestId}?error=1`);
}
