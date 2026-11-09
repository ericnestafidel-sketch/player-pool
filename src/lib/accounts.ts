import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { coachReferences, coaches, parents, users } from "@/db/schema";
import { LEGAL_VERSION } from "@/lib/legal";
import { getDb } from "@/db";
import {
  AGE_GROUPS,
  BASEBALL_AGES,
  ORGANIZATIONS,
  REFERENCE_ROLES,
} from "@/lib/coach-options";
import { httpUrlError, locationError } from "@/lib/safety";
import { isUsState } from "@/lib/states";
import { adminAccess, mergePublicMetadata, type Viewer } from "@/lib/viewer";

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function claimParent(viewer: Viewer): Promise<{ ok: true } | { ok: false; error: string }> {
  if (viewer.role === "parent") return { ok: true };
  if (viewer.role) return { ok: false, error: "This account already has a role." };
  if (viewer.signupIntent === "coach") {
    return { ok: false, error: "This account was started as a coach." };
  }
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  const clerkUser = await currentUser();
  if (!clerkUser) return { ok: false, error: "Sign in again to continue." };
  const email = clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return { ok: false, error: "An email address is required." };
  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || "Parent";
  const phone = clerkUser.primaryPhoneNumber?.phoneNumber ?? null;
  try {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: viewer.userId,
        role: "parent",
        email,
        phone,
      });
      await tx.insert(parents).values({
        userId: viewer.userId,
        displayName,
      });
    });
  } catch {
    const [existing] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, viewer.userId))
      .limit(1);
    if (existing?.role !== "parent") {
      return { ok: false, error: "Could not create the parent account." };
    }
  }
  try {
    await mergePublicMetadata(viewer.userId, { role: "parent", signupIntent: "parent" });
  } catch (error) {
    console.error("Could not sync parent role to Clerk", error instanceof Error ? error.name : "");
  }
  return { ok: true };
}

export async function ensureAdminRecord(
  userId: string,
): Promise<"ready" | "no-db" | "denied"> {
  const access = await adminAccess(userId);
  const db = getDb();
  if (!access.allowed) {
    if (!db) return "denied";
    const [existing] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return existing?.role === "admin" ? "ready" : "denied";
  }
  if (!access.metadataAdmin) {
    try {
      await mergePublicMetadata(userId, { role: "admin" });
    } catch (error) {
      console.error("Could not sync admin role to Clerk", error instanceof Error ? error.name : "");
    }
  }
  if (!db) return "no-db";
  const [existing] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (existing?.role === "admin") return "ready";
  const clerkUser = await currentUser();
  const email =
    access.verifiedEmail ??
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    `${userId}@users.playerpool.local`;
  if (existing) {
    await db.update(users).set({ role: "admin" }).where(eq(users.id, userId));
    return "ready";
  }
  await db.insert(users).values({ id: userId, role: "admin", email });
  return "ready";
}

export type FieldErrors = Record<string, string>;

export async function submitCoachApplication(
  viewer: Viewer,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error?: string; fieldErrors: FieldErrors }> {
  if (viewer.role === "coach") return { ok: true };
  if (viewer.signupIntent === "parent") {
    return {
      ok: false,
      error: "This account was started as a parent. Coach access needs its own login.",
      fieldErrors: {},
    };
  }
  if (viewer.role) {
    return {
      ok: false,
      error: "Parent accounts cannot request coach access. Coaches need their own login.",
      fieldErrors: {},
    };
  }
  const db = getDb();
  if (!db) {
    return { ok: false, error: "Database is not configured yet.", fieldErrors: {} };
  }
  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress;
  if (!email) {
    return { ok: false, error: "Your account needs an email address.", fieldErrors: {} };
  }

  const fullName = text(formData.get("fullName"));
  const phone = text(formData.get("phone"));
  const teamName = text(formData.get("teamName"));
  const organization = text(formData.get("organization"));
  const agesCoached = text(formData.get("agesCoached"));
  const yearsRaw = text(formData.get("yearsExperience"));
  const state = text(formData.get("state"));
  const county = text(formData.get("county"));
  const verifyUrl = text(formData.get("verifyUrl"));
  const useNote = text(formData.get("useNote"));
  const refName = text(formData.get("refName"));
  const refRole = text(formData.get("refRole"));
  const refTeam = text(formData.get("refTeam"));
  const refContact = text(formData.get("refContact"));

  const fieldErrors: FieldErrors = {};
  if (fullName.length < 2) fieldErrors.fullName = "Enter your full name.";
  if (phone.length < 7) fieldErrors.phone = "Enter a phone number. It stays off player pages.";
  if (teamName.length < 2) fieldErrors.teamName = "Enter your team name.";
  if (!(ORGANIZATIONS as readonly string[]).includes(organization)) {
    fieldErrors.organization = "Choose an organization.";
  }
  if (!(AGE_GROUPS as readonly string[]).includes(agesCoached)) {
    fieldErrors.agesCoached = "Choose an age group.";
  }
  let yearsExperience: number | null = null;
  if (yearsRaw) {
    const years = Number(yearsRaw);
    if (!Number.isInteger(years) || years < 0 || years > 60) {
      fieldErrors.yearsExperience = "Enter years as a whole number, or leave it blank.";
    } else {
      yearsExperience = years;
    }
  }
  if (!isUsState(state)) {
    fieldErrors.state = "Choose a state.";
  } else {
    const countyProblem = locationError(state, county);
    if (countyProblem) fieldErrors.county = countyProblem;
  }
  const urlError = httpUrlError(verifyUrl);
  if (urlError) fieldErrors.verifyUrl = urlError;
  if (useNote.length < 8) fieldErrors.useNote = "Tell Eric briefly how you will use the pool.";
  if (refName.length < 2) fieldErrors.refName = "Enter a reference name.";
  if (!(REFERENCE_ROLES as readonly string[]).includes(refRole)) {
    fieldErrors.refRole = "Choose a reference role.";
  }
  if (refTeam.length < 2) fieldErrors.refTeam = "Enter their team or organization.";
  if (refContact.length < 5) fieldErrors.refContact = "Enter an email or phone for the reference.";
  const eligible = formData.get("eligibility") === "on";
  const safetyRules = formData.get("safetyRules") === "on";
  if (!eligible) {
    fieldErrors.eligibility = "Confirm you have no disqualifying criminal record or sanctions.";
  }
  if (!safetyRules) {
    fieldErrors.safetyRules = "Agree to the safety rules in the Coach Code of Conduct.";
  }
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  const now = new Date();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: viewer.userId,
        role: "coach",
        email,
        phone,
      });
      await tx.insert(coaches).values({
        userId: viewer.userId,
        fullName,
        teamName,
        organization,
        agesCoached,
        yearsExperience,
        state,
        county,
        verifyUrl,
        useNote,
        status: "pending",
        conductAgreedAt: now,
        conductVersion: LEGAL_VERSION,
        eligibilityAttestedAt: now,
        safetyRulesAgreedAt: now,
        checklistConduct: true,
      });
      await tx.insert(coachReferences).values({
        coachId: viewer.userId,
        name: refName,
        role: refRole,
        teamOrg: refTeam,
        contact: refContact,
      });
    });
  } catch {
    const [existing] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, viewer.userId))
      .limit(1);
    if (existing?.role === "coach") return { ok: true };
    return { ok: false, error: "Could not save the request.", fieldErrors: {} };
  }
  try {
    await mergePublicMetadata(viewer.userId, {
      role: "coach",
      coachStatus: "pending",
      signupIntent: "coach",
    });
  } catch (error) {
    console.error("Could not sync coach role to Clerk", error instanceof Error ? error.name : "");
  }
  return { ok: true };
}

export async function updateCoachTeamCard(
  viewer: Viewer,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error?: string; fieldErrors: FieldErrors }> {
  if (viewer.role !== "coach" || viewer.coachStatus !== "approved") {
    return {
      ok: false,
      error: "Only approved coaches can edit the team card.",
      fieldErrors: {},
    };
  }
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet.", fieldErrors: {} };

  const teamName = text(formData.get("teamName"));
  const organization = text(formData.get("organization"));
  const ages = formData
    .getAll("ages")
    .filter((value): value is string => typeof value === "string");
  const yearsRaw = text(formData.get("yearsExperience"));
  const fieldErrors: FieldErrors = {};
  if (teamName.length < 2 || teamName.length > 80) fieldErrors.teamName = "Enter your team name.";
  if (!(ORGANIZATIONS as readonly string[]).includes(organization)) {
    fieldErrors.organization = "Choose an organization.";
  }
  const uniqueAges = BASEBALL_AGES.filter((age) => ages.includes(age));
  if (uniqueAges.length === 0) fieldErrors.ages = "Select at least one age group.";
  let yearsExperience: number | null = null;
  if (yearsRaw) {
    const years = Number(yearsRaw);
    if (!Number.isInteger(years) || years < 0 || years > 60) {
      fieldErrors.yearsExperience = "Enter years as a whole number, or leave it blank.";
    } else {
      yearsExperience = years;
    }
  }
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  try {
    await db
      .update(coaches)
      .set({
        teamName,
        organization,
        agesCoached: uniqueAges.join(", "),
        yearsExperience,
      })
      .where(eq(coaches.userId, viewer.userId));
  } catch {
    return { ok: false, error: "Could not save the team card.", fieldErrors: {} };
  }
  return { ok: true };
}

const STATUS_UPDATES = ["approved", "denied", "suspended"] as const;
type ReviewStatus = (typeof STATUS_UPDATES)[number];

export async function setCoachStatus(input: {
  adminId: string;
  coachId: string;
  status: ReviewStatus;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!STATUS_UPDATES.includes(input.status)) {
    return { ok: false, error: "Unknown status." };
  }
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  const [coach] = await db
    .select({ userId: coaches.userId })
    .from(coaches)
    .where(eq(coaches.userId, input.coachId))
    .limit(1);
  if (!coach) return { ok: false, error: "Coach not found." };
  const now = new Date();
  await db
    .update(coaches)
    .set({
      status: input.status,
      statusReason: input.reason || null,
      approvedAt: input.status === "approved" ? now : null,
      approvedBy: input.status === "approved" ? input.adminId : null,
    })
    .where(eq(coaches.userId, input.coachId));
  try {
    await mergePublicMetadata(input.coachId, { role: "coach", coachStatus: input.status });
  } catch (error) {
    console.error("Could not sync coach status to Clerk", error instanceof Error ? error.name : "");
  }
  return { ok: true };
}

export async function saveCoachChecklist(input: {
  coachId: string;
  teamPage: boolean;
  org: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  await db
    .update(coaches)
    .set({
      checklistTeamPage: input.teamPage,
      checklistOrg: input.org,
    })
    .where(eq(coaches.userId, input.coachId));
  return { ok: true };
}

export async function saveInfoRequest(input: {
  coachId: string;
  note: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const note = input.note.trim();
  if (note.length < 4) return { ok: false, error: "Write a short note first." };
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  await db
    .update(coaches)
    .set({ infoRequestNote: note, infoRequestedAt: new Date() })
    .where(eq(coaches.userId, input.coachId));
  return { ok: true };
}
