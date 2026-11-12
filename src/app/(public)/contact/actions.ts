"use server";

import { redirect } from "next/navigation";
import { supportEmail } from "@/lib/legal";

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function sendContact(formData: FormData) {
  const name = text(formData.get("name"));
  const email = text(formData.get("email"));
  const message = text(formData.get("message"));
  if (name.length < 2 || !email.includes("@") || message.length < 8) redirect("/contact?error=1");
  const to = supportEmail();
  const key = process.env["RESEND_API_KEY"];
  const from = process.env["NOTIFY_FROM_EMAIL"];
  if (!to || !key || !from) redirect("/contact?error=1");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: "Player Pool contact form",
      text: `${name} wrote:\n\n${message}`,
    }),
  });
  redirect(response.ok ? "/contact?sent=1" : "/contact?error=1");
}
