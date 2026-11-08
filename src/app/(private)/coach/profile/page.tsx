import { connection } from "next/server";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { coaches } from "@/db/schema";
import { getDb } from "@/db";
import { getRequestViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Coach profile",
  robots: { index: false, follow: false },
};

export default function CoachProfilePage() {
  return (
    <Suspense fallback={<main className="form-wrap">Loading…</main>}>
      <Profile />
    </Suspense>
  );
}

async function Profile() {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role !== "coach") redirect("/coach/signup");
  const db = getDb();
  if (!db) {
    return (
      <main className="form-wrap">
        <h1>Your team card</h1>
        <p>Database is not connected.</p>
      </main>
    );
  }
  const [row] = await db
    .select({
      fullName: coaches.fullName,
      teamName: coaches.teamName,
      organization: coaches.organization,
      agesCoached: coaches.agesCoached,
      yearsExperience: coaches.yearsExperience,
      state: coaches.state,
      county: coaches.county,
      status: coaches.status,
      verifyUrl: coaches.verifyUrl,
    })
    .from(coaches)
    .where(eq(coaches.userId, viewer.userId))
    .limit(1);
  if (!row) redirect("/coach/signup");
  return (
    <main className="form-wrap">
      <h1>Your team card</h1>
      <p className="meta">
        This is what a parent would see on a relay message later: team, ages, and years. Your email
        and phone are not on this card.
      </p>
      <div className="section-card">
        <h3>
          {row.fullName}{" "}
          <span className={`status-badge ${row.status === "approved" ? "badge-ok" : "badge-pend"}`}>
            {row.status}
          </span>
        </h3>
        <p>
          {row.teamName} · {row.organization} · {row.agesCoached}
        </p>
        <p className="meta">
          {row.state} · {row.county} County
          {row.yearsExperience != null ? ` · ${row.yearsExperience} years` : ""}
        </p>
        <p className="meta">
          Team page:{" "}
          <a href={row.verifyUrl} target="_blank" rel="noreferrer">
            {row.verifyUrl}
          </a>
        </p>
      </div>
      <p className="meta">Editing this card comes in the next session.</p>
    </main>
  );
}
