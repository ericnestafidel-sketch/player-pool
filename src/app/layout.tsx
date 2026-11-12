import type { Metadata } from "next";
import { Outfit, Source_Sans_3 } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SiteFooter } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { siteOrigin } from "@/lib/launch";
import { clerkConfigured } from "@/lib/viewer";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-outfit",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-source-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: "Travel baseball in Indiana, Illinois, and Ohio",
    template: "%s · Player Pool",
  },
  description:
    "Player Pool is launching in Indiana, Illinois, and Ohio. Parents list a player by number, USSSA level, county, and state. Approved coaches search for travel baseball tryouts. Free for coaches.",
  applicationName: "Player Pool",
  openGraph: {
    siteName: "Player Pool",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const shell = (
    <>
      {!clerkConfigured() ? (
        <div className="setup-banner">
          Sign-in is not configured in this build yet. Add Clerk keys, then redeploy.
        </div>
      ) : null}
      <SiteHeader />
      <div className="page">{children}</div>
      <SiteFooter />
    </>
  );

  return (
    <html lang="en" className={`${outfit.variable} ${sourceSans.variable}`}>
      <body>
        {clerkConfigured() ? <ClerkProvider>{shell}</ClerkProvider> : shell}
        <Analytics />
      </body>
    </html>
  );
}
