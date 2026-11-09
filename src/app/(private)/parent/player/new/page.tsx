import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PlayerForm } from "@/components/player-form";
import { emptyDraft, upcomingWeekends, WEEKENDS_SHOWN } from "@/lib/player-rules";
import { listSports, preferredSport } from "@/lib/sport";
import { getRequestViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Add a player",
  robots: { index: false, follow: false },
};

export default function NewPlayerPage() {
  return (
    <Suspense fallback={<main className="parent-panel">Loading…</main>}>
      <NewPlayer />
    </Suspense>
  );
}

async function NewPlayer() {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role !== "parent") redirect("/parent");
  const sports = await listSports();
  const sport = preferredSport(sports);
  if (!sport) {
    return (
      <main className="parent-panel">
        <h1>Add a player</h1>
        <p>The sport list is not available yet. Run the database migration, then try again.</p>
      </main>
    );
  }
  return (
    <main className="parent-panel">
      <p className="meta">
        <Link href="/parent">Back to your players</Link>
      </p>
      <h1>Add a player</h1>
      <p className="lead">
        Coaches see a number, state, and county. This form does not ask for a name, town, address,
        email, or phone.
      </p>
      <PlayerForm
        sports={sports}
        weekends={upcomingWeekends(WEEKENDS_SHOWN, new Date())}
        draft={emptyDraft(sport.slug)}
      />
    </main>
  );
}
