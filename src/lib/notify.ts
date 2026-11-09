import { absoluteUrl, fallbackOrigin } from "@/lib/launch";
import { notificationCopy } from "@/lib/message-text";

/**
 * Email is a pointer back to the site. It never includes the message body,
 * a name, or either person's email or phone. Without Resend config it logs and returns.
 */
export async function sendNotification(to: string, linkPath: string): Promise<void> {
  const link = appLink(linkPath);
  const { subject, text } = notificationCopy(link);
  const key = process.env["RESEND_API_KEY"];
  const from = process.env["NOTIFY_FROM_EMAIL"];
  if (!key || !from) {
    console.info("Player Pool notification skipped (RESEND_API_KEY or NOTIFY_FROM_EMAIL is not set).");
    return;
  }
  if (!link) {
    console.info("Player Pool notification skipped (APP_URL is not set).");
    return;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
      }),
    });
    if (!response.ok) console.error("Player Pool notification failed", response.status);
  } catch (error) {
    console.error("Player Pool notification failed", error instanceof Error ? error.name : "");
  }
}

function appLink(path: string): string | null {
  if (!path.startsWith("/parent/inbox/") && !path.startsWith("/coach/messages/")) return null;
  return absoluteUrl(path, fallbackOrigin());
}
