import { connection } from "next/server";
import type { Metadata } from "next";
import { Suspense } from "react";
import { supportEmail } from "@/lib/legal";
import { publicMetadata } from "@/lib/seo";
import { sendContact } from "./actions";

export const metadata: Metadata = publicMetadata({
  title: "Contact",
  description: "Email Coach Eric LLC dba Player Pool, or send a note with the contact form.",
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
  const email = supportEmail();
  return (
    <main className="form-wrap">
      <h1>Contact</h1>
      <p className="lead">
        Email us at <a href={`mailto:${email}`}>{email}</a>, or send a note with this form.
      </p>
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
