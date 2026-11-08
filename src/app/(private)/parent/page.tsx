import { connection } from "next/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { claimParent } from "@/lib/accounts";
import { confirmParent } from "./actions";
import { getDb } from "@/db";
import { getRequestViewer } from "@/lib/viewer";

export default function ParentPage() {
  return (
    <Suspense fallback={<main className="form-wrap">Loading…</main>}>
      <ParentHome />
    </Suspense>
  );
}

async function ParentHome() {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  if (viewer.role === "admin") redirect("/admin");
  if (viewer.role === "coach" || viewer.signupIntent === "coach") redirect("/coach/signup");
  if (!getDb()) {
    return (
      <main className="parent-panel">
        <h1>Parent dashboard</h1>
        <p className="lead">
          Neon is not connected yet, so player profiles cannot be saved. No child data is stored.
        </p>
      </main>
    );
  }
  if (viewer.role === null && viewer.signupIntent === "parent") {
    const claimed = await claimParent(viewer);
    if (!claimed.ok) {
      return (
        <main className="parent-panel">
          <h1>Parent dashboard</h1>
          <p className="field-error">{claimed.error}</p>
        </main>
      );
    }
  }
  if (viewer.role === null && viewer.signupIntent !== "parent") {
    return (
      <main className="parent-panel">
        <h1>Finish your account</h1>
        <p className="lead">
          This login is not a parent account yet. Only a parent or legal guardian can list a player.
          Children cannot create accounts.
        </p>
        <form action={confirmParent}>
          <button className="btn gold" type="submit">
            I am the parent or guardian
          </button>
        </form>
        <p className="meta">
          Coaches should <Link href="/coach/signup">request access</Link> with a coach login instead.
        </p>
      </main>
    );
  }
  return (
    <main className="parent-panel">
      <h1>Your players</h1>
      <p className="lead">
        Profiles, weekend availability, highlights, and payments come in the next build. This page
        does not ask for a child&apos;s name, town, address, email, or phone.
      </p>
      <div className="hint">
        When listing opens, each player is shown to approved coaches as a number, plus state and
        county only. You can pause or delete a profile from here.
      </div>
      <p>
        <Link href="/parent/inbox">Messages from coaches</Link>
      </p>
    </main>
  );
}
