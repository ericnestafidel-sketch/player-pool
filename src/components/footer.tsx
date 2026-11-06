import Link from "next/link";

export function SiteFooter() {
  return (
    <footer>
      <p>Built by a youth coach in Crawfordsville, Indiana · On Deck Player Pool LLC</p>
      <p>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms of Use</Link>
        <Link href="/conduct">Coach Code of Conduct</Link>
        <Link href="/coach/signup">Coaches: request access</Link>
      </p>
    </footer>
  );
}
