import { connection } from "next/server";
import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CoachCard } from "@/components/coach-card";
import { coaches, contactRequests, players } from "@/db/schema";
import { getDb } from "@/db";
import { toPublicCoach, type PublicCoach } from "@/lib/coach-profile";
import { formatPlayerLabel } from "@/lib/safety";
import { getRequestViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

const EXAMPLE_COACH: PublicCoach = {
  teamName: "Sample Thunder",
  organization: "USSSA",
  agesCoached: "9U, 10U, 11U, 12U",
  yearsExperience: 6,
  approved: true,
};

export default function ParentInboxPage() {
  return (
    <Suspense fallback={<main className="parent-panel">Loading…</main>}>
      <Inbox />
    </Suspense>
  );
}

function formatWhen(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Indiana/Indianapolis",
  }).format(value);
}

async function Inbox() {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role !== "parent") redirect("/parent");
  const db = getDb();

  // TODO(relay): contact_requests are written by the coach relay, which is not
  // built yet. Keep rendering CoachCard from team, organization, ages, and years
  // only. Never select users.email, users.phone, coach full name, or address.
  const rows = db
    ? await db
        .select({
          id: contactRequests.id,
          message: contactRequests.message,
          createdAt: contactRequests.createdAt,
          publicNumber: players.publicNumber,
          teamName: coaches.teamName,
          organization: coaches.organization,
          agesCoached: coaches.agesCoached,
          yearsExperience: coaches.yearsExperience,
          status: coaches.status,
        })
        .from(contactRequests)
        .innerJoin(players, eq(contactRequests.playerId, players.id))
        .innerJoin(coaches, eq(contactRequests.coachId, coaches.userId))
        .where(eq(players.parentId, viewer.userId))
        .orderBy(desc(contactRequests.createdAt))
    : [];

  return (
    <main className="parent-panel">
      <h1>Messages</h1>
      <p className="lead">
        Coaches contact you through Player Pool. Their email, phone, and address are never shown.
      </p>
      <p className="meta">
        <Link href="/parent">Back to your players</Link>
      </p>
      {!db ? <p>Database is not connected. No messages are loaded.</p> : null}
      {rows.length === 0 ? (
        <>
          <div className="hint">
            No messages yet. The relay is not connected, so a coach cannot deliver a request here.
          </div>
          <h3>What a coach card looks like</h3>
          <p className="meta">Example only. This is not a real coach.</p>
          <CoachCard coach={EXAMPLE_COACH} />
        </>
      ) : (
        <div className="contact-list">
          {rows.map((row) => (
            <article className="contact-card" key={row.id}>
              <p className="meta">
                {formatPlayerLabel(row.publicNumber)} · {formatWhen(row.createdAt)}
              </p>
              <CoachCard
                coach={toPublicCoach({
                  teamName: row.teamName,
                  organization: row.organization,
                  agesCoached: row.agesCoached,
                  yearsExperience: row.yearsExperience,
                  status: row.status,
                })}
              />
              <p>{row.message}</p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
