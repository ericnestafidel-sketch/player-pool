import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CoachSignupForm } from "@/components/coach-signup-form";
import { getDb } from "@/db";
import { clerkConfigured, getRequestViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Coaches: request access",
  robots: { index: false, follow: false },
};

export default function CoachSignupPage() {
  return (
    <Suspense fallback={<main className="form-wrap">Loading…</main>}>
      <CoachSignup />
    </Suspense>
  );
}

function Requirements() {
  return (
    <div className="req-box">
      <strong>What we require</strong>
      <ul>
        <li>A public team presence (team website, USSSA/Perfect Game listing, or organization page)</li>
        <li>A possible short verification call with Eric</li>
        <li>At least one reference (another coach, director, or parent from your current or recent team)</li>
        <li>
          Agreement to the <Link href="/conduct">Coach Code of Conduct</Link> and Terms
        </li>
        <li>Hand review — usually within 2 days</li>
      </ul>
    </div>
  );
}

async function CoachSignup() {
  await connection();
  if (!clerkConfigured()) {
    return (
      <main className="form-wrap">
        <h1>Coaches: request access</h1>
        <p className="lead">
          Player Pool is free for coaches. Every request is reviewed by hand. Profiles stay hidden
          until then.
        </p>
        <Requirements />
        <p>Create-account is waiting on Clerk keys. Nothing is stored yet.</p>
      </main>
    );
  }
  const viewer = await getRequestViewer();
  if (!viewer) {
    return (
      <main className="form-wrap">
        <h1>Coaches: request access</h1>
        <p className="lead">
          Player Pool is free for coaches. Create a coach account, then send your team page and one
          reference. You cannot see players while the request is pending.
        </p>
        <Requirements />
        <Link className="btn gold" href="/coach/sign-up">
          Create coach account
        </Link>
      </main>
    );
  }
  if (viewer.role === "admin") redirect("/admin");
  if (viewer.role === "parent" || viewer.signupIntent === "parent") {
    return (
      <main className="form-wrap">
        <h1>This login is a parent account</h1>
        <p className="lead">
          Parents list players. Coaches need a separate login. A parent account cannot be switched
          into coach access.
        </p>
        <Link className="btn navy" href="/parent">
          Go to your players
        </Link>
      </main>
    );
  }
  if (viewer.role === "coach") {
    redirect(viewer.coachStatus === "approved" ? "/coach/search" : "/coach/pending");
  }
  if (!getDb()) {
    return (
      <main className="form-wrap">
        <h1>Coaches: request access</h1>
        <Requirements />
        <p>The database is not connected yet, so this request cannot be saved.</p>
      </main>
    );
  }
  return (
    <main className="form-wrap">
      <h1>Coaches: request access</h1>
      <p className="lead">
        Player Pool is free for coaches. Every request is reviewed by hand — usually within 2 days.
        Profiles stay hidden until Eric approves you.
      </p>
      <Requirements />
      <CoachSignupForm />
    </main>
  );
}
