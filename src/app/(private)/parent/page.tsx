import { connection } from "next/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CoachCard } from "@/components/coach-card";
import { DeletePlayerButton } from "@/components/delete-player-button";
import { PlayerCard } from "@/components/player-card";
import { claimParent } from "@/lib/accounts";
import { formatViewedDate } from "@/lib/player-rules";
import { listParentPlayers, type ParentPlayer } from "@/lib/player-store";
import { getDb } from "@/db";
import { getRequestViewer } from "@/lib/viewer";
import { pausePlayer } from "./player/actions";
import { confirmParent } from "./actions";

export default function ParentPage() {
  return (
    <Suspense fallback={<main className="form-wrap">Loading…</main>}>
      <ParentHome />
    </Suspense>
  );
}

async function ParentHome() {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role === "admin") redirect("/admin");
  if (viewer.role === "coach" || viewer.signupIntent === "coach") redirect("/coach/signup");
  if (!getDb()) {
    return (
      <main className="parent-panel">
        <h1>Parent dashboard</h1>
        <p className="lead">
          Neon is not connected yet, so player profiles cannot be saved. No child data is stored.
        </p>
      </main>
    );
  }
  if (viewer.role === null && viewer.signupIntent === "parent") {
    const claimed = await claimParent(viewer);
    if (!claimed.ok) {
      return (
        <main className="parent-panel">
          <h1>Parent dashboard</h1>
          <p className="field-error">{claimed.error}</p>
        </main>
      );
    }
  }
  if (viewer.role === null && viewer.signupIntent !== "parent") {
    return (
      <main className="parent-panel">
        <h1>Finish your account</h1>
        <p className="lead">
          This login is not a parent account yet. Only a parent or legal guardian can list a player.
          Children cannot create accounts.
        </p>
        <form action={confirmParent}>
          <button className="btn gold" type="submit">
            I am the parent or guardian
          </button>
        </form>
        <p className="meta">
          Coaches should <Link href="/coach/signup">request access</Link> with a coach login instead.
        </p>
      </main>
    );
  }
  const roster = await listParentPlayers(viewer.userId);
  return (
    <main className="parent-panel">
      <h1>Your players</h1>
      <p className="lead">
        Each player is shown to approved coaches as a number, plus state and county. Pause hides a
        profile. Delete removes it and Player Pool purges the record within 30 days.
      </p>
      <p>
        <Link className="btn gold" href="/parent/player/new">
          Add a player
        </Link>
      </p>
      {roster.length === 0 ? (
        <div className="hint">
          No players yet. Add a profile with age group, positions, and a county. Do not enter a name,
          town, address, email, or phone.
        </div>
      ) : (
        <div className="stack">
          {roster.map((entry) => (
            <RosterCard key={entry.player.id} entry={entry} />
          ))}
        </div>
      )}
      <p>
        <Link href="/parent/inbox">Messages from coaches</Link>
      </p>
    </main>
  );
}

function RosterCard({ entry }: { entry: ParentPlayer }) {
  return (
    <section className="section-card">
      <PlayerCard
        player={entry.player}
        highlightFresh={entry.highlightFresh}
        weekends={entry.weekends}
        href={`/parent/player/${entry.player.id}`}
      />
      <div className="roster-actions">
        <Link className="btn navy" href={`/parent/player/${entry.player.id}`}>
          Edit
        </Link>
        <form action={pausePlayer}>
          <input type="hidden" name="playerId" value={entry.player.id} />
          <input type="hidden" name="paused" value={entry.player.paused ? "false" : "true"} />
          <button className="btn btn-outline" type="submit">
            {entry.player.paused ? "Show in search" : "Pause profile"}
          </button>
        </form>
        <DeletePlayerButton playerId={entry.player.id} />
      </div>
      <h3>Coaches who viewed</h3>
      {entry.viewers.length === 0 ? (
        <p className="meta">No coach has opened this profile yet. Email and phone are never shown.</p>
      ) : (
        <div className="contact-list">
          {entry.viewers.map((view) => (
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
  );
}
