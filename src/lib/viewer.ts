import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
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

export async function resolveViewer(userId: string): Promise<Viewer> {
  const base: Viewer = {
    userId,
    role: null,
    coachStatus: null,
    signupIntent: null,
  };
  const db = getDb();
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
    if (row) {
      return {
        userId,
        role: row.role,
        coachStatus: row.coachStatus,
        signupIntent: null,
      };
    }
  }

  if (!process.env.CLERK_SECRET_KEY) return base;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const pub = user.publicMetadata ?? {};
    const unsafe = user.unsafeMetadata ?? {};
    if (asRole(pub.role) === "admin") {
      return { userId, role: "admin", coachStatus: null, signupIntent: null };
    }
    return {
      userId,
      role: null,
      coachStatus: asCoachStatus(pub.coachStatus),
      signupIntent: asIntent(pub.signupIntent) ?? asIntent(unsafe.signupIntent),
    };
  } catch {
    return base;
  }
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
  if (!process.env.CLERK_SECRET_KEY) return false;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user.publicMetadata?.role === "admin";
  } catch {
    return false;
  }
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
