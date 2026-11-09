import { connection } from "next/server";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CoachCard } from "@/components/coach-card";
import { CoachProfileForm } from "@/components/coach-profile-form";
import { coaches } from "@/db/schema";
import { getDb } from "@/db";
import { selectedAges, toPublicCoach } from "@/lib/coach-profile";
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
      teamName: coaches.teamName,
      organization: coaches.organization,
      agesCoached: coaches.agesCoached,
      yearsExperience: coaches.yearsExperience,
      status: coaches.status,
      foundingCoach: coaches.foundingCoach,
      foundingNumber: coaches.foundingNumber,
    })
    .from(coaches)
    .where(eq(coaches.userId, viewer.userId))
    .limit(1);
  if (!row) redirect("/coach/signup");
  const coach = toPublicCoach(row);
  const approved = row.status === "approved";
  return (
    <main className="form-wrap">
      <h1>Your team card</h1>
      <p className="lead">
        Parents see this card in an in-app message. Your email, phone, and address stay off it.
      </p>
      {approved ? (
        <CoachProfileForm
          key={`${row.teamName}|${row.organization}|${row.agesCoached}|${row.yearsExperience ?? ""}`}
          teamName={row.teamName}
          organization={row.organization}
          ages={selectedAges(row.agesCoached)}
          yearsExperience={row.yearsExperience}
          savedAges={row.agesCoached}
        />
      ) : (
        <p className="meta">Only approved coaches can edit this card.</p>
      )}
      <CoachCard coach={coach} />
    </main>
  );
}
