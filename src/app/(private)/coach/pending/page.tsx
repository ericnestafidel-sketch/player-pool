import { connection } from "next/server";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
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
  return (
    <main className="form-wrap">
      <h1>Coach access is {status}</h1>
      <p className="lead">
        You cannot see player profiles until Eric approves this request. No player data is loaded on
        this page.
      </p>
      {team ? <p>{team}</p> : null}
      {reason ? (
        <div className="req-box">
          <strong>Note from review</strong>
          <p>{reason}</p>
        </div>
      ) : (
        <p className="meta">Hand review is usually within 2 days. You will get an email when that step is connected.</p>
      )}
      <p>
        <Link href="/coach/profile">Your team card</Link>
      </p>
    </main>
  );
}
