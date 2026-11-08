import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { clerkConfigured } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Coach account",
  robots: { index: false, follow: false },
};

export default function CoachAccountPage() {
  if (!clerkConfigured()) {
    return (
      <main className="form-wrap">
        <h1>Coach account</h1>
        <p className="lead">Clerk keys are required before a coach account can be created.</p>
        <Link href="/coach/signup">Back to requirements</Link>
      </main>
    );
  }
  return (
    <main className="auth-wrap">
      <h1>Create a coach account</h1>
      <p className="lead">
        This login is only for coaches. After your account exists you will send team details for
        Eric to review. You will not see players until he approves you.
      </p>
      <SignUp
        routing="path"
        path="/coach/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/coach/signup"
        unsafeMetadata={{ signupIntent: "coach" }}
      />
    </main>
  );
}
