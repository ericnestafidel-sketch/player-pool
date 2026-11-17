import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BoardStatus } from "@/components/board-status";
import { HowApplyingWorks } from "@/components/how-applying-works";
import { boardGate, canPostBoard, listBoardPosts, markNeedAlertsRead } from "@/lib/board";
import { getRequestViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Coach needs",
  robots: { index: false, follow: false },
};

export default function BoardPage() {
  return (
    <Suspense fallback={<main className="form-wrap">Loading…</main>}>
      <Board />
    </Suspense>
  );
}

async function Board() {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (boardGate(viewer) !== "ok") return <BoardStatus viewer={viewer} />;
  if (viewer.role === "parent") await markNeedAlertsRead(viewer.userId);
  const posts = await listBoardPosts(viewer);
  return (
    <main className="form-wrap">
      <h1>Coach needs</h1>
      <p className="lead">
        Approved coaches post the players they need. County and state only. No email, phone, or links.
        Message inside Player Pool.
      </p>
      <HowApplyingWorks />
      {canPostBoard(viewer) ? (
        <p>
          <Link className="btn gold" href="/board/new">
            Post a need
          </Link>
        </p>
      ) : null}
      {posts.length === 0 ? (
        <p className="hint">No open needs. A need leaves the board after its close date or its end date.</p>
      ) : (
        <div className="stack">
          {posts.map((post) => (
            <article className="section-card" key={post.id}>
              <h2>
                <Link href={`/board/${post.id}`}>{post.summary}</Link>
              </h2>
              {post.mine ? <p className="meta">Your post</p> : null}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
