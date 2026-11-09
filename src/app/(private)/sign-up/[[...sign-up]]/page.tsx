import { SignUp } from "@clerk/nextjs";
import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PlayerSignupSoon } from "@/components/player-signup-gate";
import { playerSignupOpen } from "@/lib/launch";
import { safeRedirectPath, withRedirect } from "@/lib/redirects";
import { clerkConfigured, getRequestViewer, homeFor, usesParentArea } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Parent sign up",
  robots: { index: false, follow: false },
};

function Agreement() {
  return (
    <p className="lead">
      By continuing you agree to the <Link href="/terms">Terms of Use</Link> and{" "}
      <Link href="/privacy">Privacy Policy</Link>.
    </p>
  );
}

export default function ParentSignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<main className="auth-wrap">Loading…</main>}>
      <ParentSignUp searchParams={searchParams} />
    </Suspense>
  );
}

async function ParentSignUp({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  await connection();
  const params = await searchParams;
  const destination = safeRedirectPath(params.redirect_url) ?? "/parent";
  if (!playerSignupOpen()) {
    const viewer = await getRequestViewer();
    if (viewer?.role === "admin" || viewer?.role === "parent") redirect("/parent");
    if (viewer && (viewer.role === "coach" || viewer.signupIntent === "coach")) redirect(homeFor(viewer));
    return <PlayerSignupSoon />;
  }
  if (!clerkConfigured()) {
    return (
      <main className="form-wrap">
        <h1>Parent sign up</h1>
        <Agreement />
        <p className="lead">
          Accounts need Clerk keys before anyone can sign up. Player profiles stay hidden until then.
        </p>
      </main>
    );
  }
  const viewer = await getRequestViewer();
  if (viewer) {
    if (usesParentArea(viewer) || (viewer.role === null && viewer.signupIntent !== "coach")) {
      redirect(destination);
    }
    redirect(homeFor(viewer));
  }
  return (
    <main className="auth-wrap">
      <h1>Parent sign up</h1>
      <p className="lead">
        This form is for parents and legal guardians, 18 or older. Children cannot create accounts.
      </p>
      <Agreement />
      <p className="meta">
        Coaches do not use this form. <Link href="/coach/signup">Request coach access</Link>.
      </p>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl={withRedirect("/sign-in", destination)}
        fallbackRedirectUrl={destination}
        unsafeMetadata={{ signupIntent: "parent" }}
      />
    </main>
  );
}
