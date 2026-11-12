import type { Metadata } from "next";
import { siteOrigin } from "@/lib/launch";

/** Indexable marketing and legal pages. Signed-in app routes are not in this list. */
export const PUBLIC_PATHS = [
  "/",
  "/pricing",
  "/coaches",
  "/coaches/how-approval-works",
  "/privacy",
  "/terms",
  "/conduct",
] as const;

export type PublicPath = (typeof PUBLIC_PATHS)[number];

export function publicPageUrl(path: PublicPath): string {
  return path === "/" ? siteOrigin() : `${siteOrigin()}${path}`;
}

export function publicMetadata(input: {
  title: string;
  description: string;
  path: PublicPath;
}): Metadata {
  const branded = `${input.title} · Player Pool`;
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      title: branded,
      description: input.description,
      url: input.path,
      siteName: "Player Pool",
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: branded,
      description: input.description,
    },
    robots: { index: true, follow: true },
  };
}

/** Organization and WebSite only. No address, phone, or email. */
export function siteJsonLd(origin = siteOrigin()) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: "Coach Eric LLC",
        legalName: "Coach Eric LLC",
        alternateName: "Player Pool",
        url: origin,
        description:
          "Coach Eric LLC doing business as Player Pool, a private nationwide travel baseball player pool.",
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: "Player Pool",
        url: origin,
        publisher: { "@id": `${origin}/#organization` },
        description:
          "Parents list a travel baseball player by number, USSSA level, county, and state. Hand-approved coaches search for tryouts.",
      },
    ],
  };
}
