"use server";

import { redirect } from "next/navigation";
import { claimParent } from "@/lib/accounts";
import { playerSignupOpen } from "@/lib/launch";
import { getRequestViewer } from "@/lib/viewer";

export async function confirmParent() {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (!playerSignupOpen()) redirect("/sign-up");
  if (viewer.role === "parent" || viewer.role === "admin") redirect("/parent");
  if (viewer.signupIntent === "coach" || viewer.role === "coach") redirect("/coach/signup");
  const result = await claimParent({ ...viewer, signupIntent: "parent" });
  if (!result.ok) redirect("/parent");
  redirect("/parent");
}
