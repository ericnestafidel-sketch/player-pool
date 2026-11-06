"use server";

import { redirect } from "next/navigation";
import { claimParent } from "@/lib/accounts";
import { getRequestViewer } from "@/lib/viewer";

export async function confirmParent() {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role === "parent") redirect("/parent");
  if (viewer.signupIntent === "coach" || viewer.role === "coach") redirect("/coach/signup");
  const result = await claimParent({ ...viewer, signupIntent: "parent" });
  if (!result.ok) redirect("/parent");
  redirect("/parent");
}
