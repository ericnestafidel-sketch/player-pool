import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { formatViewedDate } from "@/lib/player-rules";
import { listCoachThreads } from "@/lib/threads";
import { getRequestViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

export default function CoachMessagesPage() {
  return (
    <Suspense fallback={<main className="form-wrap">Loading…</main>}>
      <Messages />
    </Suspense>
  );
}

async function Messages() {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role !== "coach" || viewer.coachStatus !== "approved") {
    redirect(viewer.role === "coach" ? "/coach/pending" : "/access-denied");
  }
  const threads = await listCoachThreads(viewer.userId);
  return (
    <main className="form-wrap">
      <h1>Messages</h1>
      <p className="lead">
        Parents reply here. You never see their email or phone, and they never see yours.
      </p>
      <p className="meta">
        <Link href="/coach/search">Back to search</Link>
      </p>
      {threads.length === 0 ? (
        <div className="hint">No messages yet. Open a player profile to send one.</div>
      ) : (
        <div className="contact-list">
          {threads.map((thread) => (
            <article className="contact-card" key={thread.id}>
              <p className="meta">
                {thread.playerLabel} · {formatViewedDate(thread.createdAt)}
                {thread.paused ? " · Profile paused" : ""}
                {thread.blocked ? " · Blocked" : ""}
              </p>
              <p>{thread.preview}</p>
              <Link className="btn navy btn-sm" href={`/coach/messages/${thread.id}`}>
                Open thread
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
