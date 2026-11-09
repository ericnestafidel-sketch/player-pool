import { SiteJsonLd } from "@/components/site-jsonld";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteJsonLd />
      {children}
    </>
  );
}
