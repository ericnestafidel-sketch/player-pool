/**
 * Server-side admin bootstrap. ADMIN_EMAILS is not a NEXT_PUBLIC_ variable.
 * Do not import this module from a client component, and do not send the list
 * to the browser. Only a verified primary email can match.
 */

type PrimaryEmail = {
  emailAddress: string;
  verification: { status: string | null } | null;
} | null;

function adminEmails(): Set<string> {
  const raw = process.env["ADMIN_EMAILS"];
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAllowlistedAdminEmail(email: string): boolean {
  const target = email.trim().toLowerCase();
  if (!target) return false;
  return adminEmails().has(target);
}

export function verifiedPrimaryIsAllowlisted(email: PrimaryEmail): boolean {
  if (!email?.emailAddress) return false;
  if (email.verification?.status !== "verified") return false;
  return isAllowlistedAdminEmail(email.emailAddress);
}
