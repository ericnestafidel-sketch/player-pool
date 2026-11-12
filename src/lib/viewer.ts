import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { verifiedPrimaryIsAllowlisted } from "@/lib/admin-allowlist";
import { coaches, users } from "@/db/schema";
import { getDb } from "@/db";

export type Role = "parent" | "coach" | "admin";
export type CoachStatus = "pending" | "approved" | "denied" | "suspended";
export type SignupIntent = "parent" | "coach";

export type Viewer = {
  userId: string;
  role: Role | null;
  coachStatus: CoachStatus | null;
  signupIntent: SignupIntent | null;
  /** True when Clerk has verified the primary email. The address itself is not stored here. */
  emailVerified: boolean;
};

export function clerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  );
}

function asRole(value: unknown): Role | null {
  if (value === "parent" || value === "coach" || value === "admin") return value;
  return null;
}

function asIntent(value: unknown): SignupIntent | null {
  if (value === "parent" || value === "coach") return value;
  return null;
}

function asCoachStatus(value: unknown): CoachStatus | null {
  if (
    value === "pending" ||
    value === "approved" ||
    value === "denied" ||
    value === "suspended"
  ) {
    return value;
  }
  return null;
}

type ClerkSnapshot = {
  metadataRole: Role | null;
  coachStatus: CoachStatus | null;
  signupIntent: SignupIntent | null;
  allowlisted: boolean;
  verifiedEmail: string | null;
};

const CLERK_SNAPSHOT_TTL_MS = 15_000;
const clerkSnapshots = new Map<string, { at: number; value: ClerkSnapshot }>();

async function readClerkSnapshot(userId: string): Promise<ClerkSnapshot | null> {
  const cached = clerkSnapshots.get(userId);
  if (cached && Date.now() - cached.at < CLERK_SNAPSHOT_TTL_MS) return cached.value;
  const value = await loadClerkSnapshot(userId);
  if (value) clerkSnapshots.set(userId, { at: Date.now(), value });
  return value;
}

async function loadClerkSnapshot(userId: string): Promise<ClerkSnapshot | null> {
  if (!process.env.CLERK_SECRET_KEY) return null;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const pub = user.publicMetadata ?? {};
    const unsafe = user.unsafeMetadata ?? {};
    const primary = user.primaryEmailAddress;
    const verified =
      primary?.verification?.status === "verified" ? primary.emailAddress : null;
    return {
      metadataRole: asRole(pub.role),
      coachStatus: asCoachStatus(pub.coachStatus),
      signupIntent: asIntent(pub.signupIntent) ?? asIntent(unsafe.signupIntent),
      allowlisted: verifiedPrimaryIsAllowlisted(primary),
      verifiedEmail: verified,
    };
  } catch {
    return null;
  }
}

export type AdminAccess = {
  allowed: boolean;
  metadataAdmin: boolean;
  verifiedEmail: string | null;
};

/** Metadata admin or a verified primary email in ADMIN_EMAILS. The list stays on the server. */
export async function adminAccess(userId: string): Promise<AdminAccess> {
  const snap = await readClerkSnapshot(userId);
  if (!snap) return { allowed: false, metadataAdmin: false, verifiedEmail: null };
  const metadataAdmin = snap.metadataRole === "admin";
  return {
    allowed: metadataAdmin || snap.allowlisted,
    metadataAdmin,
    verifiedEmail: snap.verifiedEmail,
  };
}

export async function resolveViewer(userId: string): Promise<Viewer> {
  const base: Viewer = {
    userId,
    role: null,
    coachStatus: null,
    signupIntent: null,
    emailVerified: false,
  };
  const db = getDb();
  let dbRole: Role | null = null;
  let dbCoach: CoachStatus | null = null;
  if (db) {
    const [row] = await db
      .select({
        role: users.role,
        coachStatus: coaches.status,
      })
      .from(users)
      .leftJoin(coaches, eq(coaches.userId, users.id))
      .where(eq(users.id, userId))
      .limit(1);
    if (row?.role === "admin") {
      return { userId, role: "admin", coachStatus: null, signupIntent: null, emailVerified: false };
    }
    if (row) {
      dbRole = row.role;
      dbCoach = row.coachStatus;
    }
  }

  const snap = await readClerkSnapshot(userId);
  const emailVerified = Boolean(snap?.verifiedEmail);
  if (snap?.allowlisted || snap?.metadataRole === "admin") {
    return { userId, role: "admin", coachStatus: null, signupIntent: null, emailVerified };
  }
  if (dbRole) {
    return { userId, role: dbRole, coachStatus: dbCoach, signupIntent: null, emailVerified };
  }
  if (!snap) return base;
  return {
    userId,
    role: null,
    coachStatus: snap.coachStatus,
    signupIntent: snap.signupIntent,
    emailVerified,
  };
}

export async function getRequestViewer(): Promise<Viewer | null> {
  if (!clerkConfigured()) return null;
  try {
    const { userId } = await auth();
    if (!userId) return null;
    return await resolveViewer(userId);
  } catch {
    return null;
  }
}

export function usesParentArea(viewer: Viewer): boolean {
  return viewer.role === "parent" || viewer.role === "admin";
}

export function homeFor(viewer: Viewer): string {
  if (viewer.role === "admin") return "/admin";
  if (viewer.role === "parent") return "/parent";
  if (viewer.role === "coach") {
    return viewer.coachStatus === "approved" ? "/coach/search" : "/coach/pending";
  }
  if (viewer.signupIntent === "coach") return "/coach/signup";
  return "/continue";
}

export async function clerkSaysAdmin(userId: string): Promise<boolean> {
  return (await adminAccess(userId)).allowed;
}

export async function mergePublicMetadata(
  userId: string,
  patch: Record<string, string | null>,
): Promise<void> {
  if (!process.env.CLERK_SECRET_KEY) return;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const current = { ...(user.publicMetadata ?? {}) } as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete current[key];
    else current[key] = value;
  }
  await client.users.updateUserMetadata(userId, { publicMetadata: current });
}
