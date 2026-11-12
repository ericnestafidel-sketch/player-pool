import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BoardForm } from "@/components/board-form";
import { canPostBoard } from "@/lib/board";
import { seasonOffers } from "@/lib/seasons";
import { getRequestViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Post a need",
  robots: { index: false, follow: false },
};

export default function NewBoardPostPage() {
  return (
    <Suspense fallback={<main className="form-wrap">Loading…</main>}>
      <NewPost />
    </Suspense>
  );
}

async function NewPost() {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (!canPostBoard(viewer)) redirect(viewer.role === "coach" ? "/coach/pending" : "/access-denied");
  return (
    <main className="form-wrap">
      <p className="meta">
        <Link href="/board">Coach needs</Link>
      </p>
      <h1>Post a need</h1>
      <p className="lead">
        County and state only. Notes cannot include an email, phone number, or link. Parents message you
        in the app.
      </p>
      <BoardForm action="create" offers={seasonOffers(new Date())} />
    </main>
  );
}
