import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { clerkConfigured } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Parent sign up",
  robots: { index: false, follow: false },
};

export default function ParentSignUpPage() {
  if (!clerkConfigured()) {
    return (
      <main className="form-wrap">
        <h1>Parent sign up</h1>
        <p className="lead">
          Accounts need Clerk keys before anyone can sign up. Player profiles stay hidden until then.
        </p>
      </main>
    );
  }
  return (
    <main className="auth-wrap">
      <h1>Parent sign up</h1>
      <p className="lead">
        This form is for parents and legal guardians, 18 or older. Children cannot create accounts.
        By continuing you agree to the <Link href="/terms">Terms of Use</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
      <p className="meta">
        Coaches do not use this form. <Link href="/coach/signup">Request coach access</Link>.
      </p>
      <Suspense fallback={<p className="lead">Loading…</p>}>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/parent"
          unsafeMetadata={{ signupIntent: "parent" }}
        />
      </Suspense>
    </main>
  );
}
