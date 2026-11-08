import { connection } from "next/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PlayerCard } from "@/components/player-card";
import { readPublicPlayer } from "@/lib/player-access";
import { getRequestViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Your player",
  robots: { index: false, follow: false },
};

export default function ParentPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main className="form-wrap">Checking access…</main>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  const { id } = await params;
  const player = await readPublicPlayer(viewer, id, "edit");
  if (!player) notFound();
  return (
    <main className="parent-panel">
      <h1>{player.label}</h1>
      <p className="lead">
        Editing, pause, and delete arrive in the next session. This screen never asks for a name,
        town, or address.
      </p>
      <PlayerCard player={player} />
    </main>
  );
}
