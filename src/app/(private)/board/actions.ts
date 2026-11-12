"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { closeBoardPost, reportBoardPost, saveBoardPost, type BoardInput } from "@/lib/board";
import { startParentContact } from "@/lib/threads";
import { getRequestViewer } from "@/lib/viewer";

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function inputFrom(formData: FormData): BoardInput {
  return {
    teamName: text(formData.get("teamName")),
    ageGroup: text(formData.get("ageGroup")),
    positions: formData.getAll("positions").filter((value): value is string => typeof value === "string"),
    skillLevels: formData.getAll("skillLevels").filter((value): value is string => typeof value === "string"),
    state: text(formData.get("state")),
    county: text(formData.get("county")),
    seasonCode: text(formData.get("seasonCode")),
    neededThrough: text(formData.get("neededThrough")),
    notes: text(formData.get("notes")),
  };
}

export async function createBoardPost(formData: FormData) {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  const result = await saveBoardPost(viewer, inputFrom(formData));
  if (!result.ok) redirect("/board/new?error=1");
  revalidatePath("/board");
  redirect(`/board/${result.id}`);
}

export async function updateBoardPost(formData: FormData) {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  const id = text(formData.get("postId"));
  const result = await saveBoardPost(viewer, inputFrom(formData), id);
  if (!result.ok) redirect(`/board/${id}?error=1`);
  revalidatePath("/board");
  revalidatePath(`/board/${id}`);
  redirect(`/board/${id}`);
}

export async function closePost(formData: FormData) {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  const id = text(formData.get("postId"));
  await closeBoardPost(viewer, id);
  revalidatePath("/board");
  revalidatePath(`/board/${id}`);
  redirect("/board");
}

export async function reportPost(formData: FormData) {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  const id = text(formData.get("postId"));
  await reportBoardPost(viewer, id, text(formData.get("reason")));
  revalidatePath("/admin");
  redirect(`/board/${id}?reported=1`);
}

export async function messageCoach(formData: FormData) {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  const result = await startParentContact(
    viewer,
    text(formData.get("coachId")),
    text(formData.get("playerId")),
    text(formData.get("message")),
  );
  if (!result.ok) redirect(`/board/${text(formData.get("postId"))}?error=1`);
  revalidatePath("/parent/inbox");
  revalidatePath("/coach/messages");
  redirect(`/parent/inbox/${result.requestId}`);
}
