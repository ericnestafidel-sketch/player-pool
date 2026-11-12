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
        <li>
          At least one of: a team website, USSSA or other league listing, team social page, tournament
          roster link, or a request for a short call with our staff
        </li>
        <li>At least one reference (another coach, director, or parent from your current or recent team)</li>
        <li>
          Agreement to the <Link href="/conduct">Coach Code of Conduct</Link> and Terms
        </li>
        <li>
          Review by our experienced baseball staff, usually within 24–48 hours.{" "}
          <Link href="/coaches/how-approval-works">How approval works</Link>
        </li>
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
          Player Pool is free for coaches. Every coach is reviewed and approved by our experienced
          baseball staff. Profiles stay hidden until then.
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
          Player Pool is free for coaches. Create a coach account, then send one proof of coaching and
          one reference. You cannot see players while the request is pending.
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
        Player Pool is free for coaches. Every coach is reviewed and approved by our experienced
        baseball staff, usually within 24–48 hours. Profiles stay hidden until you are approved.
      </p>
      <Requirements />
      <CoachSignupForm />
    </main>
  );
}
