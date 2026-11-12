import { currentUser } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
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
import { planAdminClaim } from "@/lib/admin-record";
import { playerSignupOpen } from "@/lib/launch";
import { adminAccess, mergePublicMetadata, type Viewer } from "@/lib/viewer";

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function claimParent(viewer: Viewer): Promise<{ ok: true } | { ok: false; error: string }> {
  if (viewer.role === "parent") return { ok: true };
  if (!playerSignupOpen()) return { ok: false, error: "Player sign-up is coming soon." };
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

/** A parents row for an admin test account. Does not change users.role or Clerk metadata. */
export async function ensureParentProfile(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  const [account] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!account) {
    const created = await ensureAdminRecord(userId);
    if (created !== "ready") return { ok: false, error: "Database is not configured yet." };
  } else if (account.role !== "admin") {
    return { ok: false, error: "This account already has a role." };
  }
  const [existing] = await db
    .select({ userId: parents.userId })
    .from(parents)
    .where(eq(parents.userId, userId))
    .limit(1);
  if (existing) return { ok: true };
  const clerkUser = await currentUser();
  const displayName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() || "Admin";
  await db.insert(parents).values({ userId, displayName }).onConflictDoNothing();
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
  if (!db) return "no-db";
  const clerkUser = await currentUser();
  const email =
    access.verifiedEmail ??
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    `${userId}@users.playerpool.local`;
  try {
    await db.transaction(async (tx) => {
      await claimAdminUser(tx, userId, email);
    });
  } catch (error) {
    console.error("Could not save admin record", error instanceof Error ? error.name : "");
    return "denied";
  }
  if (!access.metadataAdmin) {
    try {
      await mergePublicMetadata(userId, { role: "admin" });
    } catch (error) {
      console.error("Could not sync admin role to Clerk", error instanceof Error ? error.name : "");
    }
  }
  return "ready";
}

type AdminTx = Parameters<NonNullable<ReturnType<typeof getDb>>["transaction"]>[0] extends (
  tx: infer T,
) => Promise<unknown>
  ? T
  : never;

/** Move a dev-instance user (same email, old Clerk id) onto the signed-in id. */
async function claimAdminUser(tx: AdminTx, userId: string, email: string) {
  const [byId] = await tx
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const [byEmail] = await tx
    .select({ id: users.id, phone: users.phone })
    .from(users)
    .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
    .limit(1);
  const plan = planAdminClaim({
    userId,
    byIdRole: byId?.role ?? null,
    emailOwnerId: byEmail?.id ?? null,
  });
  if (plan === "ready") return;
  if (plan === "promote") {
    await tx.update(users).set({ role: "admin", email }).where(eq(users.id, userId));
    return;
  }
  if (plan === "insert") {
    await tx.insert(users).values({ id: userId, role: "admin", email });
    return;
  }
  const oldId = byEmail?.id;
  if (!oldId || oldId === userId) return;
  await tx
    .update(users)
    .set({ email: `${oldId}@replaced.playerpool.invalid` })
    .where(eq(users.id, oldId));
  if (byId) {
    await tx.update(users).set({ role: "admin", email }).where(eq(users.id, userId));
  } else {
    await tx.insert(users).values({
      id: userId,
      role: "admin",
      email,
      phone: byEmail?.phone ?? null,
    });
  }
  await tx.execute(sql`
    insert into parents (user_id, display_name, terms_accepted_at, terms_version)
    select ${userId}, display_name, terms_accepted_at, terms_version
    from parents where user_id = ${oldId}
    on conflict (user_id) do nothing
  `);
  await tx.execute(sql`update players set parent_id = ${userId} where parent_id = ${oldId}`);
  await tx.execute(sql`update subscriptions set parent_id = ${userId} where parent_id = ${oldId}`);
  await tx.execute(sql`update blocks set parent_id = ${userId} where parent_id = ${oldId}`);
  await tx.execute(sql`update reports set reporter_parent_id = ${userId} where reporter_parent_id = ${oldId}`);
  await tx.execute(sql`delete from parents where user_id = ${oldId}`);
  await tx.execute(sql`
    with old as (select * from coaches where user_id = ${oldId}),
    cleared as (update coaches set founding_number = null where user_id = ${oldId})
    insert into coaches (
      user_id, full_name, team_name, organization, ages_coached, years_experience,
      state, county, verify_url, proof_kind, call_requested, founding_coach, founding_number,
      use_note, status, status_reason, conduct_agreed_at, conduct_version,
      eligibility_attested_at, safety_rules_agreed_at, approved_at, approved_by,
      daily_contact_count, contact_count_reset_at, checklist_team_page, checklist_org,
      checklist_conduct, info_request_note, info_requested_at, created_at
    )
    select
      ${userId}, full_name, team_name, organization, ages_coached, years_experience,
      state, county, verify_url, proof_kind, call_requested, founding_coach, founding_number,
      use_note, status, status_reason, conduct_agreed_at, conduct_version,
      eligibility_attested_at, safety_rules_agreed_at, approved_at, approved_by,
      daily_contact_count, contact_count_reset_at, checklist_team_page, checklist_org,
      checklist_conduct, info_request_note, info_requested_at, created_at
    from old
    on conflict (user_id) do nothing
  `);
  await tx.execute(sql`update coach_references set coach_id = ${userId} where coach_id = ${oldId}`);
  await tx.execute(sql`update profile_views set coach_id = ${userId} where coach_id = ${oldId}`);
  await tx.execute(sql`update contact_requests set coach_id = ${userId} where coach_id = ${oldId}`);
  await tx.execute(sql`update blocks set coach_id = ${userId} where coach_id = ${oldId}`);
  await tx.execute(sql`update reports set coach_id = ${userId} where coach_id = ${oldId}`);
  await tx.execute(sql`update coach_notes set coach_id = ${userId} where coach_id = ${oldId}`);
  await tx.execute(sql`update saved_searches set coach_id = ${userId} where coach_id = ${oldId}`);
  await tx.execute(sql`update coaches set approved_by = ${userId} where approved_by = ${oldId}`);
  await tx.execute(sql`delete from coaches where user_id = ${oldId}`);
  await tx.execute(sql`delete from users where id = ${oldId}`);
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
  const websiteUrl = text(formData.get("websiteUrl"));
  const leagueUrl = text(formData.get("leagueUrl"));
  const socialUrl = text(formData.get("socialUrl"));
  const rosterUrl = text(formData.get("rosterUrl"));
  const callRequested = formData.get("callRequested") === "on";
  const proofs = [
    ["website", websiteUrl],
    ["league", leagueUrl],
    ["social", socialUrl],
    ["roster", rosterUrl],
  ] as const;
  const provided = proofs.filter(([, url]) => url.length > 0);
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
  for (const [, url] of provided) {
    const urlError = httpUrlError(url);
    if (urlError) {
      fieldErrors.proof = urlError;
      break;
    }
  }
  if (!provided.length && !callRequested) {
    fieldErrors.proof = "Add one link, or request a short call with our staff.";
  }
  const proofKind = provided[0]?.[0] ?? (callRequested ? "call" : null);
  const verifyUrl = provided[0]?.[1] || null;
  if (useNote.length < 8) fieldErrors.useNote = "Tell us briefly how you will use the pool.";
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
        proofKind,
        callRequested,
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
  const now = new Date();
  const updated = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(48201)`);
    const [coach] = await tx
      .select({
        userId: coaches.userId,
        foundingCoach: coaches.foundingCoach,
        foundingNumber: coaches.foundingNumber,
      })
      .from(coaches)
      .where(eq(coaches.userId, input.coachId))
      .limit(1);
    if (!coach) return false;
    let foundingCoach = coach.foundingCoach;
    let foundingNumber = coach.foundingNumber;
    if (input.status === "approved" && !foundingCoach && foundingNumber == null) {
      const [countRow] = await tx
        .select({ total: sql<number>`count(*)::int` })
        .from(coaches)
        .where(eq(coaches.foundingCoach, true));
      if ((countRow?.total ?? 0) < 20) {
        const [maxRow] = await tx
          .select({ max: sql<number>`coalesce(max(${coaches.foundingNumber}), 0)::int` })
          .from(coaches);
        foundingNumber = (maxRow?.max ?? 0) + 1;
        foundingCoach = true;
      }
    }
    await tx
      .update(coaches)
      .set({
        status: input.status,
        statusReason: input.reason || null,
        approvedAt: input.status === "approved" ? now : null,
        approvedBy: input.status === "approved" ? input.adminId : null,
        foundingCoach,
        foundingNumber,
      })
      .where(eq(coaches.userId, input.coachId));
    return true;
  });
  if (!updated) return { ok: false, error: "Coach not found." };
  try {
    await mergePublicMetadata(input.coachId, { role: "coach", coachStatus: input.status });
  } catch (error) {
    console.error("Could not sync coach status to Clerk", error instanceof Error ? error.name : "");
  }
  return { ok: true };
}

export async function setFoundingCoach(
  coachId: string,
  enabled: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: "Database is not configured yet." };
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(48201)`);
    const [coach] = await tx
      .select({
        userId: coaches.userId,
        foundingCoach: coaches.foundingCoach,
        foundingNumber: coaches.foundingNumber,
      })
      .from(coaches)
      .where(eq(coaches.userId, coachId))
      .limit(1);
    if (!coach) return { ok: false, error: "Coach not found." };
    if (!enabled) {
      await tx.update(coaches).set({ foundingCoach: false }).where(eq(coaches.userId, coachId));
      return { ok: true };
    }
    if (coach.foundingCoach) return { ok: true };
    const [countRow] = await tx
      .select({ total: sql<number>`count(*)::int` })
      .from(coaches)
      .where(eq(coaches.foundingCoach, true));
    if ((countRow?.total ?? 0) >= 20) {
      return { ok: false, error: "The 20 founding coach spots are filled." };
    }
    if (coach.foundingNumber != null) {
      await tx.update(coaches).set({ foundingCoach: true }).where(eq(coaches.userId, coachId));
      return { ok: true };
    }
    const [maxRow] = await tx
      .select({ max: sql<number>`coalesce(max(${coaches.foundingNumber}), 0)::int` })
      .from(coaches);
    await tx
      .update(coaches)
      .set({ foundingCoach: true, foundingNumber: (maxRow?.max ?? 0) + 1 })
      .where(eq(coaches.userId, coachId));
    return { ok: true };
  });
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
