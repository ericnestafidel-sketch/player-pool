import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { LEGAL_VERSION } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  const source = readFileSync(path.join(process.cwd(), "src/content/legal/privacy.md"), "utf8");
  return (
    <>
      <LegalDocument source={source} versionLabel={`Privacy version ${LEGAL_VERSION}`} />
    </>
  );
}
