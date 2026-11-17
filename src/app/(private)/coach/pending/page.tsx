import { connection } from "next/server";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CoachSetupChecklist } from "@/components/coach-setup-checklist";
import { coaches } from "@/db/schema";
import { getDb } from "@/db";
import { getRequestViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Request pending",
  robots: { index: false, follow: false },
};

export default function PendingPage() {
  return (
    <Suspense fallback={<main className="form-wrap">Loading…</main>}>
      <Pending />
    </Suspense>
  );
}

async function Pending() {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role !== "coach") redirect("/coach/signup");
  if (viewer.coachStatus === "approved") redirect("/coach/search");
  const db = getDb();
  let team = "";
  let reason = "";
  if (db) {
    const [row] = await db
      .select({
        teamName: coaches.teamName,
        organization: coaches.organization,
        statusReason: coaches.statusReason,
        infoRequestNote: coaches.infoRequestNote,
      })
      .from(coaches)
      .where(eq(coaches.userId, viewer.userId))
      .limit(1);
    if (row) {
      team = `${row.teamName} · ${row.organization}`;
      reason = row.statusReason ?? row.infoRequestNote ?? "";
    }
  }
  const status = viewer.coachStatus ?? "pending";
  const inReview = status === "pending";
  return (
    <main className="form-wrap">
      <h1>{inReview ? "Application in review" : `Coach access is ${status}`}</h1>
      <CoachSetupChecklist step="review" />
      <p className="lead">
        {inReview
          ? "We review the application, usually within 24–48 hours. You cannot see player profiles until it is approved. Posting on the Coach Needs Board unlocks once you are approved."
          : "You cannot see player profiles or post a Need until this coach account is approved. No player data is loaded on this page."}
      </p>
      {team ? <p>{team}</p> : null}
      {reason ? (
        <div className="req-box">
          <strong>Note from review</strong>
          <p>{reason}</p>
        </div>
      ) : (
        <p className="meta">
          Review is usually within 24–48 hours.{" "}
          <Link href="/coaches/how-approval-works">How approval works</Link>.
        </p>
      )}
      <p>
        <Link href="/coach/profile">Your team card</Link>
      </p>
    </main>
  );
}
