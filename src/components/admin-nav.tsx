import Link from "next/link";

function Links() {
  return (
    <>
      <Link href="/admin">Admin</Link>
      <Link href="/parent">Parent view</Link>
      <Link href="/coach/search">Coach search preview</Link>
    </>
  );
}

export function AdminNav({ tone = "page" }: { tone?: "header" | "page" }) {
  if (tone === "header") return <Links />;
  return (
    <nav className="admin-nav" aria-label="Admin">
      <Links />
    </nav>
  );
}
