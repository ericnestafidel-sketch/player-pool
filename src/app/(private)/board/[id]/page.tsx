import { connection } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BoardForm } from "@/components/board-form";
import { BoardStatus } from "@/components/board-status";
import { closePost, messageCoach, reportPost } from "@/app/(private)/board/actions";
import { players } from "@/db/schema";
import { getDb } from "@/db";
import { boardGate, canPostBoard, loadBoardPost } from "@/lib/board";
import { formatPlayerLabel } from "@/lib/safety";
import { getRequestViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Coach need",
  robots: { index: false, follow: false },
};

export default function BoardPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string; reported?: string; error?: string }>;
}) {
  return (
    <Suspense fallback={<main className="form-wrap">Loading…</main>}>
      <Post params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Post({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string; reported?: string; error?: string }>;
}) {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (boardGate(viewer) !== "ok") return <BoardStatus viewer={viewer} />;
  const { id } = await params;
  const query = await searchParams;
  const post = await loadBoardPost(viewer, id);
  if (!post) notFound();
  const db = getDb();
  const mine = post.mine && canPostBoard(viewer);
  const parentPlayers =
    viewer.role === "parent" && db
      ? await db
          .select({ id: players.id, publicNumber: players.publicNumber })
          .from(players)
          .where(and(eq(players.parentId, viewer.userId), isNull(players.deletedAt)))
      : [];
  return (
    <main className="form-wrap">
      <p className="meta">
        <Link href="/board">Coach needs</Link>
      </p>
      <h1>{post.summary}</h1>
      {mine ? <p className="meta">Team on your post: {post.teamName}</p> : null}
      {query.reported ? <p className="meta">Report sent. Our staff can hide or remove this post.</p> : null}
      {query.error ? <p className="field-error">That could not be saved. Check the fields and try again.</p> : null}
      {post.notes ? <p>{post.notes}</p> : null}
      <p className="meta">Coach contact details are not shown. Messages stay in Player Pool.</p>
      {mine && query.edit === "1" ? (
        <BoardForm action="edit" post={post} />
      ) : null}
      {mine ? (
        <div className="roster-actions">
          <Link className="btn navy" href={`/board/${post.id}?edit=1`}>
            Edit
          </Link>
          <form action={closePost}>
            <input type="hidden" name="postId" value={post.id} />
            <button className="btn btn-outline" type="submit">
              Close post
            </button>
          </form>
        </div>
      ) : null}
      {!mine && viewer.role === "parent" ? (
        <form action={messageCoach} className="section-card">
          <h2>Apply</h2>
          <p className="meta">
            Apply with a Player # profile. The team name is not on this page. It appears in your
            message thread after you apply.
          </p>
          <input type="hidden" name="postId" value={post.id} />
          <input type="hidden" name="coachId" value={post.coachId} />
          {parentPlayers.length === 0 ? (
            <p>Add a player before you can apply.</p>
          ) : (
            <>
              <label htmlFor="playerId">Your player</label>
              <select id="playerId" name="playerId" required defaultValue={parentPlayers[0]?.id}>
                {parentPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {formatPlayerLabel(player.publicNumber)}
                  </option>
                ))}
              </select>
              <label htmlFor="message">Note (optional)</label>
              <textarea id="message" name="message" maxLength={2000} rows={4} />
              <button className="btn gold" type="submit">
                Apply
              </button>
            </>
          )}
        </form>
      ) : null}
      {!mine ? (
        <form action={reportPost} className="section-card">
          <h2>Report</h2>
          <input type="hidden" name="postId" value={post.id} />
          <label htmlFor="reason">Reason</label>
          <textarea id="reason" name="reason" required minLength={4} rows={3} />
          <button className="btn btn-outline" type="submit">
            Report
          </button>
        </form>
      ) : null}
    </main>
  );
}
