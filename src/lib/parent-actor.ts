import { redirect } from "next/navigation";
import { ensureParentProfile } from "@/lib/accounts";
import { getRequestViewer, usesParentArea } from "@/lib/viewer";

/** Parent, or an admin using the parent area without giving up admin. */
export async function requireParentActor(): Promise<string> {
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (!usesParentArea(viewer)) {
    redirect(viewer.role === "coach" || viewer.signupIntent === "coach" ? "/coach/signup" : "/access-denied");
  }
  if (viewer.role === "admin") {
    const ready = await ensureParentProfile(viewer.userId);
    if (!ready.ok) redirect("/parent");
  }
  return viewer.userId;
}
