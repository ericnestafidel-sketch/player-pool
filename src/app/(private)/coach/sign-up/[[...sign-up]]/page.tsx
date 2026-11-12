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
        Player Pool lists minors, so every coach is reviewed and approved by our experienced baseball
        staff before seeing any player profile. Here&apos;s what we check:
      </p>
      <ol className="approval-steps">
        <li>
          At least one proof: a team website, league listing, social page, tournament roster, or a
          short call with our staff.
        </li>
        <li>Your name, team, and organization.</li>
        <li>
          At least one reference: another coach, a director, or a parent from a current or recent
          team. We keep it on file and only contact them if something doesn&apos;t add up.
        </li>
        <li>
          <span>
            Agreeing to the Player Pool <Link href="/conduct">Coach Code of Conduct</Link>.
          </span>
        </li>
      </ol>
      <p className="approval-foot">
        Coaches use Player Pool free. Review is usually within 24–48 hours.{" "}
        <Link href="/coaches/how-approval-works">How approval works</Link>.
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
          our staff to review. You will not see players until you are approved.
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
