import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { clerkConfigured } from "@/lib/viewer";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function SignInPage() {
  if (!clerkConfigured()) {
    return (
      <main className="form-wrap">
        <h1>Sign in</h1>
        <p className="lead">
          Sign-in needs Clerk keys from the Vercel Marketplace. Add them, then redeploy. Until then,
          player pages stay closed.
        </p>
      </main>
    );
  }
  return (
    <main className="auth-wrap">
      <h1>Sign in</h1>
      <p className="lead">
        Parents and guardians sign in here. Coaches who already requested access do too.{" "}
        <Link href="/coach/signup">Coaches: request access</Link> if you have not applied.
      </p>
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/continue" />
    </main>
  );
}
