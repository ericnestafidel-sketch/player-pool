import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CoachNoteForm } from "@/components/coach-note-form";
import { ContactCoachForm } from "@/components/contact-coach-form";
import { PlayerCard } from "@/components/player-card";
import { RecordProfileView } from "@/components/record-profile-view";
import { ViewerList } from "@/components/viewer-list";
import { canReadPlayer } from "@/lib/player-access";
import { formatViewedDate, formatWeekend, upcomingWeekends, WEEKENDS_SHOWN } from "@/lib/player-rules";
import { listPlayerViewers, loadCoachNote, loadReadableDetail } from "@/lib/player-store";
import { listCoachPlayerThreads } from "@/lib/threads";
import { getRequestViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Player",
  robots: { index: false, follow: false },
};

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main className="form-wrap">Checking access…</main>}>
      <PlayerView params={params} />
    </Suspense>
  );
}

async function PlayerView({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  const { id } = await params;
  if (!(await canReadPlayer(viewer, id))) notFound();
  const now = new Date();
  const detail = await loadReadableDetail(id, now);
  if (!detail) notFound();
  const coach = viewer.role === "coach" && viewer.coachStatus === "approved";
  const [note, viewers, threads] = await Promise.all([
    coach ? loadCoachNote(viewer.userId, id) : Promise.resolve(null),
    viewer.role === "parent" ? listPlayerViewers(id) : Promise.resolve([]),
    coach ? listCoachPlayerThreads(viewer.userId, id) : Promise.resolve([]),
  ]);
  const weekends = upcomingWeekends(WEEKENDS_SHOWN, now).map((value) => ({
    value,
    label: formatWeekend(value),
  }));
  return (
    <main className="form-wrap">
      {coach ? <RecordProfileView playerId={id} /> : null}
      <p className="meta">
        <Link href={coach ? "/coach/search" : "/parent"}>
          {coach ? "Back to search" : "Back to your players"}
        </Link>
      </p>
      <h1>{detail.player.label}</h1>
      <PlayerCard
        player={detail.player}
        highlightFresh={detail.highlightFresh}
        weekends={detail.weekends}
      />
      {detail.stats.length > 0 ? (
        <div className="stats-row">
          {detail.stats.map((stat) => (
            <span className="stat" key={stat.name}>
              {stat.name}: {stat.value}
            </span>
          ))}
        </div>
      ) : null}
      {detail.highlights.length > 0 ? (
        <section>
          <h3>Highlights</h3>
          <ul>
            {detail.highlights.map((highlight) => (
              <li key={highlight.url}>
                <a href={highlight.url} target="_blank" rel="noopener noreferrer">
                  {highlight.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {coach ? (
        <>
          {threads.length > 0 ? (
            <p className="meta">
              {threads.map((thread) => (
                <Link key={thread.id} href={`/coach/messages/${thread.id}`}>
                  Message from {formatViewedDate(thread.createdAt)}
                </Link>
              ))}
            </p>
          ) : null}
          <ContactCoachForm playerId={id} weekends={weekends} />
          <CoachNoteForm playerId={id} note={note ?? ""} />
        </>
      ) : null}
      {viewer.role === "parent" ? (
        <section>
          <p>
            <Link href={`/parent/player/${id}`}>Edit this profile</Link>
          </p>
          <h3>Coaches who viewed</h3>
          <ViewerList viewers={viewers} returnTo={`/players/${id}`} />
        </section>
      ) : null}
    </main>
  );
}
