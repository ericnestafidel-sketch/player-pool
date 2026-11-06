import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { homeFor, getRequestViewer } from "@/lib/viewer";

export default function ContinuePage() {
  return (
    <Suspense fallback={<main className="form-wrap">Loading…</main>}>
      <Continue />
    </Suspense>
  );
}

async function Continue() {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  redirect(homeFor(viewer));
  return null;
}
