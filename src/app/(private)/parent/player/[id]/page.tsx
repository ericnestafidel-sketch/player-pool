import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CoachCard } from "@/components/coach-card";
import { DeletePlayerButton } from "@/components/delete-player-button";
import { PlayerForm } from "@/components/player-form";
import { pausePlayer } from "@/app/(private)/parent/player/actions";
import {
  formatViewedDate,
  upcomingWeekends,
  weekendInRange,
  WEEKENDS_SHOWN,
} from "@/lib/player-rules";
import { loadPlayerEditor } from "@/lib/player-store";
import { listSports } from "@/lib/sport";
import { getRequestViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Your player",
  robots: { index: false, follow: false },
};

export default function ParentPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main className="parent-panel">Checking access…</main>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role !== "parent") redirect("/parent");
  const { id } = await params;
  const now = new Date();
  const [editor, sports] = await Promise.all([
    loadPlayerEditor(viewer.userId, id, now),
    listSports(),
  ]);
  if (!editor) notFound();
  if (sports.length === 0) {
    return (
      <main className="parent-panel">
        <h1>{editor.label}</h1>
        <p>The sport list is not available yet. Run the database migration, then try again.</p>
      </main>
    );
  }
  const weekends = upcomingWeekends(WEEKENDS_SHOWN, now);
  for (const iso of Object.keys(editor.draft.availability)) {
    if (weekendInRange(iso, now) && !weekends.includes(iso)) weekends.push(iso);
  }
  weekends.sort();
  return (
    <main className="parent-panel">
      <p className="meta">
        <Link href="/parent">Back to your players</Link>
      </p>
      <h1>{editor.label}</h1>
      <p className="lead">
        Coaches see {editor.label}, plus state and county. This page does not ask for a name, town,
        or address.
      </p>
      {editor.highlightFresh ? (
        <p>
          <span className="badge-hl">90-day highlight</span>
        </p>
      ) : null}
      <PlayerForm
        key={editor.id}
        sports={sports}
        weekends={weekends}
        draft={editor.draft}
        label={editor.label}
      />

      <section className="section-card">
        <h3>Search visibility</h3>
        <p className="meta">
          {editor.paused
            ? "Paused. Approved coaches cannot see this profile. Pause is not the same as delete."
            : "Visible to approved coaches. Pause hides it without deleting it."}
        </p>
        <form action={pausePlayer}>
          <input type="hidden" name="playerId" value={editor.id} />
          <input type="hidden" name="paused" value={editor.paused ? "false" : "true"} />
          <button className="btn btn-outline" type="submit">
            {editor.paused ? "Show in coach search" : "Pause profile"}
          </button>
        </form>
      </section>

      <section className="section-card">
        <h3>Coaches who viewed this profile</h3>
        <p className="meta">Team card only. Coach email and phone are not shown.</p>
        {editor.viewers.length === 0 ? (
          <p className="meta">No coach has opened this profile yet.</p>
        ) : (
          <div className="contact-list">
            {editor.viewers.map((view) => (
              <div
                key={`${view.coach.teamName}-${view.coach.organization}-${view.coach.agesCoached}-${view.viewedAt.toISOString()}`}
              >
                <p className="meta">Viewed {formatViewedDate(view.viewedAt)}</p>
                <CoachCard coach={view.coach} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="danger-zone">
        <h3>Delete profile</h3>
        <p>
          One click removes {editor.label} from search. Player Pool purges the record within 30 days.
        </p>
        <DeletePlayerButton playerId={editor.id} />
      </section>
    </main>
  );
}
