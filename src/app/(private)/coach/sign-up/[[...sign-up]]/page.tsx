import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { clerkConfigured } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Coach account",
  robots: { index: false, follow: false },
};

function ApprovalRequirements() {
  return (
    <section className="approval-panel" aria-labelledby="approval-heading">
      <h2 id="approval-heading">What it takes to be approved</h2>
      <p>
        Player Pool lists minors, so every coach is approved by hand before seeing any player
        profile. Here&apos;s what we check:
      </p>
      <ol className="approval-steps">
        <li>
          A public team presence: a team website, social page, or USSSA/GameChanger listing that
          shows you coach the team.
        </li>
        <li>Your name, team, and organization, matching that public listing.</li>
        <li>
          At least one reference: another coach, a director, or a parent from a current or recent
          team. We keep it on file and only contact them if something doesn&apos;t add up.
        </li>
        <li>A possible short verification call with the site owner.</li>
        <li>Agreeing to the Player Pool Coach Code of Conduct.</li>
      </ol>
      <p className="approval-foot">
        Coaches use Player Pool free. Approval usually takes 1 to 2 days.
      </p>
    </section>
  );
}

export default function CoachAccountPage() {
  if (!clerkConfigured()) {
    return (
      <main className="coach-signup">
        <ApprovalRequirements />
        <div className="auth-wrap">
          <h1>Coach account</h1>
          <p className="lead">Clerk keys are required before a coach account can be created.</p>
          <Link href="/coach/signup">Back to requirements</Link>
        </div>
      </main>
    );
  }
  return (
    <main className="coach-signup">
      <ApprovalRequirements />
      <div className="auth-wrap">
        <h1>Create a coach account</h1>
        <p className="lead">
          This login is only for coaches. After your account exists you will send team details for
          Eric to review. You will not see players until he approves you.
        </p>
        <Suspense fallback={<p className="lead">Loading…</p>}>
          <SignUp
            routing="path"
            path="/coach/sign-up"
            signInUrl="/sign-in"
            forceRedirectUrl="/coach/signup"
            unsafeMetadata={{ signupIntent: "coach" }}
          />
        </Suspense>
      </div>
    </main>
  );
}
