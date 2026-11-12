import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { canPostBoard, canReadBoard, listBoardPosts } from "@/lib/board";
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
  if (!canReadBoard(viewer)) redirect(viewer.role === "coach" ? "/coach/pending" : "/access-denied");
  const posts = await listBoardPosts(viewer);
  return (
    <main className="form-wrap">
      <h1>Coach needs</h1>
      <p className="lead">
        Approved coaches post the players they need. County and state only. No email, phone, or links.
        Message inside Player Pool.
      </p>
      {canPostBoard(viewer) ? (
        <p>
          <Link className="btn gold" href="/board/new">
            Post a need
          </Link>
        </p>
      ) : null}
      {posts.length === 0 ? (
        <p className="hint">No open posts. Posts close at season end or after 60 days.</p>
      ) : (
        <div className="stack">
          {posts.map((post) => (
            <article className="section-card" key={post.id}>
              <h2>
                <Link href={`/board/${post.id}`}>{post.teamName}</Link>
              </h2>
              <p className="meta">
                {post.ageGroup} · {post.positions.join(", ")} · {post.skillLevels.join(" / ")}
              </p>
              <p className="meta">
                {post.state} · {post.county} County
                {post.seasonLabel ? ` · ${post.seasonLabel}` : ""}
                {post.neededThrough ? ` · needed through ${post.neededThrough}` : ""}
              </p>
              {post.notes ? <p>{post.notes}</p> : null}
              {post.mine ? <p className="meta">Your post</p> : null}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
