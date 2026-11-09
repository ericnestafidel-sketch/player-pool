import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { safeRedirectPath } from "@/lib/redirects";
import { homeFor, getRequestViewer, usesParentArea } from "@/lib/viewer";

export default function ContinuePage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<main className="form-wrap">Loading…</main>}>
      <Continue searchParams={searchParams} />
    </Suspense>
  );
}

async function Continue({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  const params = await searchParams;
  const destination = safeRedirectPath(params.redirect_url);
  if (destination && (usesParentArea(viewer) || viewer.role === null)) redirect(destination);
  redirect(homeFor(viewer));
  return null;
}
