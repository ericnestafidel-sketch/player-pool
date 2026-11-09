import { SignIn } from "@clerk/nextjs";
import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { safeRedirectPath, withRedirect } from "@/lib/redirects";
import { clerkConfigured, getRequestViewer, homeFor, usesParentArea } from "@/lib/viewer";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<main className="auth-wrap">Loading…</main>}>
      <SignInGate searchParams={searchParams} />
    </Suspense>
  );
}

async function SignInGate({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  await connection();
  const params = await searchParams;
  const destination = safeRedirectPath(params.redirect_url);
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
  const viewer = await getRequestViewer();
  if (viewer) {
    if (destination && (usesParentArea(viewer) || viewer.role === null)) redirect(destination);
    redirect(homeFor(viewer));
  }
  return (
    <main className="auth-wrap">
      <h1>Sign in</h1>
      <p className="lead">
        Parents and guardians sign in here. Coaches who already requested access do too.{" "}
        <Link href="/coach/signup">Coaches: request access</Link> if you have not applied.
      </p>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl={withRedirect("/sign-up", destination ?? "/parent")}
        fallbackRedirectUrl={destination ?? "/continue"}
      />
    </main>
  );
}
