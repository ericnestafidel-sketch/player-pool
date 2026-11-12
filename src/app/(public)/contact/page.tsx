import { connection } from "next/server";
import type { Metadata } from "next";
import { Suspense } from "react";
import { publicMetadata } from "@/lib/seo";
import { sendContact } from "./actions";

export const metadata: Metadata = publicMetadata({
  title: "Contact",
  description: "Send a note to Player Pool. This form does not show an email address.",
  path: "/contact",
});

export default function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  return (
    <Suspense fallback={<main className="form-wrap">Loading…</main>}>
      <Contact searchParams={searchParams} />
    </Suspense>
  );
}

async function Contact({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  await connection();
  const params = await searchParams;
  return (
    <main className="form-wrap">
      <h1>Contact</h1>
      <p className="lead">Send a note. This page does not show an email address.</p>
      {params.sent === "1" ? <p className="meta">Thanks. We received your note.</p> : null}
      {params.error === "1" ? (
        <p className="field-error">We could not deliver that note yet. A mailbox is not connected.</p>
      ) : null}
      <form action={sendContact} className="section-card">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" required maxLength={80} />
        <label htmlFor="email">Your email</label>
        <input id="email" name="email" type="email" required maxLength={120} />
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" required minLength={8} maxLength={2000} rows={6} />
        <button className="btn gold" type="submit">
          Send
        </button>
      </form>
    </main>
  );
}
