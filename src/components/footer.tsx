import Link from "next/link";

export function SiteFooter() {
  return (
    <footer>
      <p>Built by a youth coach in Crawfordsville, Indiana · On Deck Player Pool LLC</p>
      <p>
        <Link href="/pricing">Pricing</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/conduct">Coach Code of Conduct</Link>
      </p>
      <p>© 2026 On Deck Player Pool LLC</p>
    </footer>
  );
}
