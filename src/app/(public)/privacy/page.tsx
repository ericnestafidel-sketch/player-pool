import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { LEGAL_VERSION } from "@/lib/legal";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Privacy Policy",
  description:
    "How Coach Eric LLC dba Player Pool protects an Indiana travel baseball listing. Players are numbers, location is state and county only, and coaches never see a child's email or phone.",
  path: "/privacy",
});

export default function PrivacyPage() {
  const source = readFileSync(path.join(process.cwd(), "src/content/legal/privacy.md"), "utf8");
  return (
    <>
      <LegalDocument source={source} versionLabel={`Privacy version ${LEGAL_VERSION}`} />
    </>
  );
}
