import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Full Player Pool data model.
 * Private columns (users.email, users.phone, coach_references.contact) are for
 * the account owner and the admin queue only. Player rows have no name, town,
 * address, email, or phone. Coaches see "Player #NNN", state, and county.
 */

export const userRole = pgEnum("user_role", ["parent", "coach", "admin"]);
export const coachStatus = pgEnum("coach_status", [
  "pending",
  "approved",
  "denied",
  "suspended",
]);
export const playerStatus = pgEnum("player_status", ["full", "pickup", "not"]);
export const availabilityState = pgEnum("availability_state", ["avail", "busy"]);
export const planType = pgEnum("plan_type", ["season", "yearly"]);
export const contactRequestStatus = pgEnum("contact_request_status", [
  "sent",
  "closed",
]);
export const reportStatus = pgEnum("report_status", ["open", "reviewed"]);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    role: userRole("role").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const parents = pgTable("parents", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  founder: boolean("founder").notNull().default(false),
});

export const coaches = pgTable(
  "coaches",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    /** Parent team card. Email and phone stay on users and are never selected for parents. */
    teamName: text("team_name").notNull(),
    organization: text("organization").notNull(),
    agesCoached: text("ages_coached").notNull(),
    yearsExperience: integer("years_experience"),
    state: text("state").notNull(),
    county: text("county").notNull(),
    verifyUrl: text("verify_url").notNull(),
    useNote: text("use_note").notNull(),
    status: coachStatus("status").notNull().default("pending"),
    statusReason: text("status_reason"),
    conductAgreedAt: timestamp("conduct_agreed_at", { withTimezone: true }).notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: text("approved_by"),
    dailyContactCount: integer("daily_contact_count").notNull().default(0),
    contactCountResetAt: timestamp("contact_count_reset_at", { withTimezone: true }),
    checklistTeamPage: boolean("checklist_team_page").notNull().default(false),
    checklistOrg: boolean("checklist_org").notNull().default(false),
    checklistConduct: boolean("checklist_conduct").notNull().default(false),
    infoRequestNote: text("info_request_note"),
    infoRequestedAt: timestamp("info_requested_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("coaches_status_idx").on(table.status)],
);

export const coachReferences = pgTable("coach_references", {
  id: uuid("id").primaryKey().defaultRandom(),
  coachId: text("coach_id")
    .notNull()
    .references(() => coaches.userId, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  teamOrg: text("team_org").notNull(),
  /** Kept on file for Eric. Never returned to parents or other coaches. */
  contact: text("contact").notNull(),
});

export const sports = pgTable("sports", {
  slug: text("slug").primaryKey(),
  label: text("label").notNull(),
  ageLabels: text("age_labels").array().notNull(),
  levelLabels: text("level_labels").array().notNull(),
  positionLabels: text("position_labels").array().notNull(),
});

export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicNumber: integer("public_number")
      .generatedAlwaysAsIdentity({ startWith: 100, name: "player_public_number_seq" })
      .notNull(),
    parentId: text("parent_id")
      .notNull()
      .references(() => parents.userId, { onDelete: "cascade" }),
    sport: text("sport")
      .notNull()
      .default("baseball")
      .references(() => sports.slug),
    birthYear: integer("birth_year").notNull(),
    ageGroup: text("age_group").notNull(),
    positions: text("positions").array().notNull(),
    skillLevel: text("skill_level").notNull(),
    state: text("state").notNull(),
    county: text("county").notNull(),
    status: playerStatus("status").notNull(),
    travelMiles: integer("travel_miles"),
    season: text("season"),
    note: text("note"),
    paused: boolean("paused").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    highlightUploadedAt: timestamp("highlight_uploaded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("players_public_number_unique").on(table.publicNumber),
    index("players_parent_idx").on(table.parentId),
    index("players_visible_idx")
      .on(table.sport, table.state, table.county, table.ageGroup, table.status)
      .where(sql`${table.paused} = false AND ${table.deletedAt} IS NULL`),
  ],
);

export const playerStats = pgTable("player_stats", {
  playerId: uuid("player_id")
    .primaryKey()
    .references(() => players.id, { onDelete: "cascade" }),
  data: jsonb("data").notNull().default({}),
});

export const highlights = pgTable("highlights", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerId: uuid("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  /** No player names, jersey names, or school names. */
  title: text("title").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const availabilityWeekends = pgTable(
  "availability_weekends",
  {
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    weekendStart: date("weekend_start").notNull(),
    state: availabilityState("state").notNull(),
  },
  (table) => [primaryKey({ columns: [table.playerId, table.weekendStart] })],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: text("parent_id")
      .notNull()
      .references(() => parents.userId),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    plan: planType("plan").notNull(),
    seasonCode: text("season_code"),
    year: integer("year"),
    amountCents: integer("amount_cents").notNull(),
    founder: boolean("founder").notNull().default(false),
    stripeSessionId: text("stripe_session_id"),
    stripePaymentIntent: text("stripe_payment_intent"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    viewedByCoach: boolean("viewed_by_coach").notNull().default(false),
  },
  (table) => [index("subscriptions_player_expires_idx").on(table.playerId, table.expiresAt)],
);

/** Single row (id = 1). claimed_count cannot pass cap (25). */
export const founderSlots = pgTable(
  "founder_slots",
  {
    id: integer("id").primaryKey(),
    claimedCount: integer("claimed_count").notNull().default(0),
    cap: integer("cap").notNull().default(25),
  },
  (table) => [
    check("founder_slots_singleton", sql`${table.id} = 1`),
    check("founder_slots_cap", sql`${table.cap} = 25`),
    check(
      "founder_slots_count",
      sql`${table.claimedCount} >= 0 AND ${table.claimedCount} <= ${table.cap}`,
    ),
  ],
);

export const founderClaims = pgTable(
  "founder_claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: text("parent_id")
      .notNull()
      .references(() => parents.userId),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    claimedAt: timestamp("claimed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("founder_claims_parent_unique").on(table.parentId)],
);

export const profileViews = pgTable(
  "profile_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    coachId: text("coach_id")
      .notNull()
      .references(() => coaches.userId),
    viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("profile_views_player_idx").on(table.playerId, table.viewedAt),
    index("profile_views_coach_idx").on(table.coachId, table.viewedAt),
  ],
);

export const contactRequests = pgTable(
  "contact_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    coachId: text("coach_id")
      .notNull()
      .references(() => coaches.userId),
    weekend: date("weekend"),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    status: contactRequestStatus("status").notNull().default("sent"),
  },
  (table) => [index("contact_requests_coach_day_idx").on(table.coachId, table.createdAt)],
);

export const blocks = pgTable(
  "blocks",
  {
    parentId: text("parent_id")
      .notNull()
      .references(() => parents.userId, { onDelete: "cascade" }),
    coachId: text("coach_id")
      .notNull()
      .references(() => coaches.userId, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.parentId, table.coachId] })],
);

/**
 * A parent report inserts here and sets coaches.status to suspended in the same
 * transaction. The report UI lands in a later session; the columns are ready.
 */
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterParentId: text("reporter_parent_id")
      .notNull()
      .references(() => parents.userId),
    coachId: text("coach_id")
      .notNull()
      .references(() => coaches.userId),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    status: reportStatus("status").notNull().default("open"),
  },
  (table) => [index("reports_coach_idx").on(table.coachId, table.createdAt)],
);

export const coachNotes = pgTable(
  "coach_notes",
  {
    coachId: text("coach_id")
      .notNull()
      .references(() => coaches.userId, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.coachId, table.playerId] })],
);

export const savedSearches = pgTable("saved_searches", {
  id: uuid("id").primaryKey().defaultRandom(),
  coachId: text("coach_id")
    .notNull()
    .references(() => coaches.userId, { onDelete: "cascade" }),
  name: text("name").notNull(),
  filters: jsonb("filters").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
