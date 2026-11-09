import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { LEGAL_VERSION } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  const source = readFileSync(path.join(process.cwd(), "src/content/legal/terms.md"), "utf8");
  return (
    <>
      <LegalDocument source={source} versionLabel={`Terms version ${LEGAL_VERSION}`} />
    </>
  );
}
