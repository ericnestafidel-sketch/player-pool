import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CoachCard } from "@/components/coach-card";
import { formatViewedDate } from "@/lib/player-rules";
import { listParentThreads } from "@/lib/threads";
import { getRequestViewer, usesParentArea } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

export default function ParentInboxPage() {
  return (
    <Suspense fallback={<main className="parent-panel">Loading…</main>}>
      <Inbox />
    </Suspense>
  );
}

async function Inbox() {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (!usesParentArea(viewer)) redirect("/parent");
  const threads = await listParentThreads(viewer.userId);
  return (
    <main className="parent-panel">
      <h1>Messages</h1>
      <p className="lead">
        Coaches contact you through Player Pool. You see their team card, never their email or phone.
        Replies stay on this site.
      </p>
      <p className="meta">
        <Link href="/parent">Back to your players</Link>
      </p>
      {threads.length === 0 ? (
        <div className="hint">No messages yet. An approved coach can send one from a player profile.</div>
      ) : (
        <div className="contact-list">
          {threads.map((thread) => (
            <article className="contact-card" key={thread.id}>
              <p className="meta">
                {thread.playerLabel} · {formatViewedDate(thread.createdAt)}
                {thread.blocked ? " · Blocked" : ""}
              </p>
              <CoachCard coach={thread.coach} />
              <p>{thread.preview}</p>
              <Link className="btn navy btn-sm" href={`/parent/inbox/${thread.id}`}>
                Open thread
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
