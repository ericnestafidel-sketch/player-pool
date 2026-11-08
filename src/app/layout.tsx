import type { Metadata } from "next";
import { Outfit, Source_Sans_3 } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { SiteFooter } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
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
  title: {
    default: "Player Pool",
    template: "%s · Player Pool",
  },
  description:
    "Parents list a player by number, state, and county. Hand-approved travel coaches search the private pool.",
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
      </body>
    </html>
  );
}
