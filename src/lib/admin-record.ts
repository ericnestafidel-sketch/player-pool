export type AdminClaim = "ready" | "promote" | "insert" | "relink";

/**
 * How to attach this Clerk user as admin.
 * `relink` means the allowlisted email already belongs to a different user id
 * (typical after a Clerk dev instance is replaced by production).
 */
export function planAdminClaim(input: {
  userId: string;
  byIdRole: "parent" | "coach" | "admin" | null;
  emailOwnerId: string | null;
}): AdminClaim {
  if (input.emailOwnerId && input.emailOwnerId !== input.userId) return "relink";
  if (input.byIdRole === "admin") return "ready";
  if (input.byIdRole) return "promote";
  return "insert";
}
