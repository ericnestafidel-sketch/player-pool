import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { LEGAL_VERSION } from "@/lib/legal";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Terms of Use",
  description:
    "Terms for parents and travel baseball coaches on Player Pool. One-time Indiana listings, refunds, and hand-approved USSSA coach access from Coach Eric LLC.",
  path: "/terms",
});

export default function TermsPage() {
  const source = readFileSync(path.join(process.cwd(), "src/content/legal/terms.md"), "utf8");
  return (
    <>
      <LegalDocument source={source} versionLabel={`Terms version ${LEGAL_VERSION}`} />
    </>
  );
}
