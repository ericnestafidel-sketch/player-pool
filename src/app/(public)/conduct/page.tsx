import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { LEGAL_VERSION } from "@/lib/legal";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Coach Code of Conduct",
  description:
    "Safety rules for hand-approved travel baseball coaches on Player Pool. Contact the parent only, with no one-on-one contact with a youth player.",
  path: "/conduct",
});

export default function ConductPage() {
  const source = readFileSync(path.join(process.cwd(), "src/content/legal/conduct.md"), "utf8");
  return (
    <>
      <LegalDocument source={source} versionLabel={`Conduct version ${LEGAL_VERSION}`} />
    </>
  );
}
