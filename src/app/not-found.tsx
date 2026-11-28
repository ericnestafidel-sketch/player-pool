import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="form-wrap">
      <h1>Page not found</h1>
      <p className="lead">That page is not on Player Pool.</p>
      <Link className="btn navy" href="/">
        Back home
      </Link>
    </main>
  );
}
