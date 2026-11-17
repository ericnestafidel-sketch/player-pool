import { privateTextError } from "@/lib/player-rules";

export const DAILY_CONTACT_CAP = 10;
const MESSAGE_MAX = 2000;

export const MATCHING_NEED_SUBJECT = "You have a new matching Need on Player Pool";

/** The only sentence a notification email may contain, plus an in-app link. */
export function notificationCopy(
  link: string | null,
  subject = "You have a new message on Player Pool",
): { subject: string; text: string } {
  const text = link ? `${subject}\n\n${link}` : subject;
  return { subject, text };
}

export function messageError(value: string): string | null {
  const text = value.trim();
  if (text.length < 8) return "Write a short message.";
  if (text.length > MESSAGE_MAX) return `Keep the message under ${MESSAGE_MAX} characters.`;
  return privateTextError(text, "The message");
}
