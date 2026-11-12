import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ThreadReplyForm } from "@/components/thread-reply-form";
import { blockThisThread, replyAsCoach, reportThisThread, unblockThisThread } from "@/app/(private)/coach/messages/actions";
import { formatViewedDate, formatWeekend } from "@/lib/player-rules";
import { loadCoachThread } from "@/lib/threads";
import { getRequestViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Message",
  robots: { index: false, follow: false },
};

export default function CoachThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<main className="form-wrap">Loading…</main>}>
      <Thread params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Thread({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role !== "coach" || viewer.coachStatus !== "approved") {
    redirect(viewer.role === "coach" ? "/coach/pending" : "/access-denied");
  }
  const { id } = await params;
  const query = await searchParams;
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
      {thread.blocked ? (
        <p className="meta">This thread is blocked. Unblock it before you reply.</p>
      ) : thread.paused ? (
        <p className="meta">This profile is paused, so you cannot send another message.</p>
      ) : (
        <ThreadReplyForm requestId={thread.id} action={replyAsCoach} />
      )}
      <div className="coach-actions">
        {thread.blocked ? (
          <form action={unblockThisThread}>
            <input type="hidden" name="requestId" value={thread.id} />
            <button className="btn btn-outline btn-sm" type="submit">
              Unblock thread
            </button>
          </form>
        ) : (
          <form action={blockThisThread}>
            <input type="hidden" name="requestId" value={thread.id} />
            <button className="btn btn-outline btn-sm" type="submit">
              Block thread
            </button>
          </form>
        )}
        <form action={reportThisThread}>
          <input type="hidden" name="requestId" value={thread.id} />
          <input
            className="reason-input"
            name="reason"
            required
            minLength={4}
            maxLength={500}
            placeholder="What happened?"
            aria-label="Report reason"
          />
          <button className="btn btn-danger btn-sm" type="submit">
            Report
          </button>
        </form>
      </div>
      {query.error === "1" ? <p className="field-error">Write a short reason before reporting.</p> : null}
    </main>
  );
}
