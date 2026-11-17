import type { Viewer } from "@/lib/viewer";

/** Nav label for a signed-in account that has not chosen or finished a role. */
export function unfinishedSetupNav(viewer: Viewer): { href: string; label: string } | null {
  if (viewer.role !== null) return null;
  if (viewer.signupIntent === "coach") {
    return { href: "/coach/signup", label: "Finish coach application" };
  }
  if (viewer.signupIntent === "parent") {
    return { href: "/parent", label: "Finish parent setup" };
  }
  return { href: "/continue", label: "Choose account type" };
}
