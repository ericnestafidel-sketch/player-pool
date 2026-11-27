import { absoluteUrl, fallbackOrigin, siteOrigin } from "@/lib/launch";
import { supportEmail } from "@/lib/legal";
import { notificationCopy } from "@/lib/message-text";

/**
 * Email is a pointer back to the site. It never includes the message body,
 * a name, or either person's email or phone. Without Resend config it logs and returns.
 */
export async function sendNotification(to: string, linkPath: string, subject?: string): Promise<void> {
  const link = appLink(linkPath);
  const note = notificationCopy(link, subject);
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
        subject: note.subject,
        text: note.text,
      }),
    });
    if (!response.ok) console.error("Player Pool notification failed", response.status);
  } catch (error) {
    console.error("Player Pool notification failed", error instanceof Error ? error.name : "");
  }
}

function appLink(path: string): string | null {
  if (path !== "/board" && !path.startsWith("/parent/inbox/") && !path.startsWith("/coach/messages/")) {
    return null;
  }
  return absoluteUrl(path, fallbackOrigin());
}

export type PendingCoachAlert = {
  fullName: string;
  teamName: string;
  organization: string;
  state: string;
};

/**
 * Staff notice when a coach lands in pending review. Includes only the coach's
 * name, team/organization, state, and a link to /admin. No player data, email,
 * or phone. Without Resend config it logs and returns.
 */
export async function sendPendingCoachAlert(coach: PendingCoachAlert): Promise<void> {
  const key = process.env["RESEND_API_KEY"];
  const from = process.env["NOTIFY_FROM_EMAIL"];
  if (!key || !from) {
    console.info("Player Pool pending-coach alert skipped (RESEND_API_KEY or NOTIFY_FROM_EMAIL is not set).");
    return;
  }
  const link = absoluteUrl("/admin", fallbackOrigin() || siteOrigin());
  if (!link) {
    console.info("Player Pool pending-coach alert skipped (could not build the /admin link).");
    return;
  }
  const to = supportEmail();
  const text = [
    "A coach requested access and is pending approval.",
    "",
    `Name: ${coach.fullName}`,
    `Team / organization: ${coach.teamName} / ${coach.organization}`,
    `State: ${coach.state}`,
    "",
    `Review the request: ${link}`,
  ].join("\n");
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
        subject: "New coach pending approval",
        text,
      }),
    });
    if (!response.ok) console.error("Player Pool pending-coach alert failed", response.status);
  } catch (error) {
    console.error("Player Pool pending-coach alert failed", error instanceof Error ? error.name : "");
  }
}
