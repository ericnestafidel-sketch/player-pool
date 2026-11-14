import { UserButton } from "@clerk/nextjs";
import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin-nav";
import { PlayerSignupClosedButton } from "@/components/player-signup-gate";
import { playerSignupOpen } from "@/lib/launch";
import { withRedirect } from "@/lib/redirects";
import { clerkConfigured, getRequestViewer } from "@/lib/viewer";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="logo" href="/">
        ⚾ Player Pool
      </Link>
      <nav>
        <Link href="/#how">How it works</Link>
        <Link href="/#safety">Safety</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/coaches">Coaches: request access</Link>
        <Suspense fallback={<Link href="/sign-in">Sign in</Link>}>
          <HeaderSession />
        </Suspense>
      </nav>
    </header>
  );
}

async function HeaderSession() {
  await connection();
  if (!clerkConfigured()) {
    return <Link href="/sign-in">Sign in</Link>;
  }
  const viewer = await getRequestViewer();
  if (!viewer) {
    return (
      <>
        <Link href="/sign-in">Sign in</Link>
        {playerSignupOpen() ? (
          <Link href={withRedirect("/sign-up", "/parent")}>List a player</Link>
        ) : (
          <PlayerSignupClosedButton tone="nav" />
        )}
      </>
    );
  }
  return (
    <>
      {viewer.role === "parent" ? (
        <>
          <Link href="/parent">Your players</Link>
          <Link href="/parent/inbox">Messages</Link>
          <Link href="/board">Coach Needs Board</Link>
        </>
      ) : null}
      {viewer.role === "coach" && viewer.coachStatus === "approved" ? (
        <>
          <Link href="/coach/search">Search</Link>
          <Link href="/coach/messages">Messages</Link>
          <Link href="/board">Coach Needs Board</Link>
          <Link href="/coach/profile">Team card</Link>
        </>
      ) : null}
      {viewer.role === "coach" && viewer.coachStatus !== "approved" ? (
        <Link href="/coach/pending">Request status</Link>
      ) : null}
      {viewer.role === "admin" ? <AdminNav tone="header" /> : null}
      {viewer.role === null ? <Link href="/continue">Finish setup</Link> : null}
      <span className="nav-user">
        <UserButton />
      </span>
    </>
  );
}
