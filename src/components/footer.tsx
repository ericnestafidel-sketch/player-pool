import Link from "next/link";
import { BUSINESS_COPYRIGHT, BUSINESS_LEGAL_NAME } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer>
      <p>Built by a youth coach in Crawfordsville, Indiana · {BUSINESS_LEGAL_NAME}</p>
      <p>
        <Link href="/pricing">Pricing</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/conduct">Coach Code of Conduct</Link>
      </p>
      <p>© 2026 {BUSINESS_COPYRIGHT}</p>
    </footer>
  );
}
