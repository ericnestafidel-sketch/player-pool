import Link from "next/link";
import { BUSINESS_COPYRIGHT, BUSINESS_LEGAL_NAME } from "@/lib/brand";
import { supportEmail } from "@/lib/legal";

export function SiteFooter() {
  const email = supportEmail();
  return (
    <footer>
      <p>Built by a youth coach in Indiana · {BUSINESS_LEGAL_NAME}</p>
      <p>
        <Link href="/coaches">Coaches</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/terms#refunds">Refunds</Link>
        <Link href="/conduct">Coach Code of Conduct</Link>
      </p>
      <p>
        {email ? (
          <a href={`mailto:${email}`}>{email}</a>
        ) : (
          "Contact: coming soon"
        )}
      </p>
      <p>© 2026 {BUSINESS_COPYRIGHT}</p>
    </footer>
  );
}
