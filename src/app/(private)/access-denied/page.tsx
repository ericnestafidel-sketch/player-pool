import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Profile unavailable",
  robots: { index: false, follow: false },
};

export default function AccessDeniedPage() {
  return (
    <main className="form-wrap">
      <h1>This profile is not available</h1>
      <p className="lead">
        Player profiles are visible only to a hand-approved coach, or to the parent who listed that
        player. Nothing here identifies a child.
      </p>
      <Link className="btn navy" href="/">
        Back home
      </Link>
    </main>
  );
}
