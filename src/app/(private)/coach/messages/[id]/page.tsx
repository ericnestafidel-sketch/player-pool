import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ThreadReplyForm } from "@/components/thread-reply-form";
import { replyAsCoach } from "@/app/(private)/coach/messages/actions";
import { formatViewedDate, formatWeekend } from "@/lib/player-rules";
import { loadCoachThread } from "@/lib/threads";
import { getRequestViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Message",
  robots: { index: false, follow: false },
};

export default function CoachThreadPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main className="form-wrap">Loading…</main>}>
      <Thread params={params} />
    </Suspense>
  );
}

async function Thread({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role !== "coach" || viewer.coachStatus !== "approved") {
    redirect(viewer.role === "coach" ? "/coach/pending" : "/access-denied");
  }
  const { id } = await params;
  const thread = await loadCoachThread(viewer.userId, id);
  if (!thread) notFound();
  return (
    <main className="form-wrap">
      <p className="meta">
        <Link href="/coach/messages">All messages</Link>
      </p>
      <h1>{thread.playerLabel}</h1>
      <p className="meta">
        {thread.weekend ? `Weekend of ${formatWeekend(thread.weekend)}` : "No weekend chosen"}
      </p>
      <div className="thread">
        {thread.messages.map((message) => (
          <article className={`bubble ${message.author}`} key={message.id}>
            <p className="meta">
              {message.author === "coach" ? "You" : "Parent"} · {formatViewedDate(message.createdAt)}
            </p>
            <p>{message.body}</p>
          </article>
        ))}
      </div>
      {thread.paused ? (
        <p className="meta">This profile is paused, so you cannot send another message.</p>
      ) : (
        <ThreadReplyForm requestId={thread.id} action={replyAsCoach} />
      )}
    </main>
  );
}
