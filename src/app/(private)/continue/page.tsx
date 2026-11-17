import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { CoachSetupChecklist } from "@/components/coach-setup-checklist";
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
  const next = homeFor(viewer);
  if (next !== "/continue") redirect(next);
  return (
    <main className="form-wrap">
      <h1>Choose account type</h1>
      <CoachSetupChecklist step={1} />
      <p className="lead">
        Coaches apply for access, then wait for review. Parents list a player. A login cannot be both.
      </p>
      <p>
        <Link className="btn gold" href="/coach/signup">
          I&apos;m a coach
        </Link>{" "}
        <Link className="btn navy" href="/parent">
          I&apos;m a parent
        </Link>
      </p>
    </main>
  );
}
