import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { LEGAL_VERSION } from "@/lib/legal";

export const metadata: Metadata = { title: "Coach Code of Conduct" };

export default function ConductPage() {
  const source = readFileSync(path.join(process.cwd(), "src/content/legal/conduct.md"), "utf8");
  return (
    <>
      <LegalDocument source={source} versionLabel={`Conduct version ${LEGAL_VERSION}`} />
    </>
  );
}
