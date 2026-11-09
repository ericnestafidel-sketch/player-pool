import type { Metadata } from "next";

/** Signed-in app, player profiles, and coach detail routes stay out of search indexes. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
