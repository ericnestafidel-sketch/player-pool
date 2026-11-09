import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CoachCard } from "@/components/coach-card";
import { ParentCoachActions } from "@/components/parent-coach-actions";
import { ThreadReplyForm } from "@/components/thread-reply-form";
import { replyAsParent } from "@/app/(private)/parent/inbox/actions";
import { formatViewedDate, formatWeekend } from "@/lib/player-rules";
import { loadParentThread } from "@/lib/threads";
import { getRequestViewer, usesParentArea } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Message",
  robots: { index: false, follow: false },
};

export default function ParentThreadPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main className="parent-panel">Loading…</main>}>
      <Thread params={params} />
    </Suspense>
  );
}

async function Thread({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (!usesParentArea(viewer)) redirect("/parent");
  const { id } = await params;
  const thread = await loadParentThread(viewer.userId, id);
  if (!thread) notFound();
  const canReply = !thread.blocked && thread.coachApproved;
  return (
    <main className="parent-panel">
      <p className="meta">
        <Link href="/parent/inbox">All messages</Link>
      </p>
      <h1>{thread.playerLabel}</h1>
      <p className="meta">
        {thread.weekend ? `Weekend of ${formatWeekend(thread.weekend)}` : "No weekend chosen"}
      </p>
      <CoachCard coach={thread.coach} />
      <div className="thread">
        {thread.messages.map((message) => (
          <article className={`bubble ${message.author}`} key={message.id}>
            <p className="meta">
              {message.author === "coach" ? "Coach" : "You"} · {formatViewedDate(message.createdAt)}
            </p>
            <p>{message.body}</p>
          </article>
        ))}
      </div>
      {canReply ? (
        <ThreadReplyForm requestId={thread.id} action={replyAsParent} />
      ) : (
        <p className="meta">
          {thread.blocked
            ? "This coach is blocked. Unblock them if you want to reply."
            : "This coach is suspended and cannot reply."}
        </p>
      )}
      <ParentCoachActions
        coachId={thread.coachId}
        blocked={thread.blocked}
        returnTo={`/parent/inbox/${thread.id}`}
      />
    </main>
  );
}
