import { connection } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { askForInfo, updateChecklist, updateCoachStatus } from "./actions";
import { ensureAdminRecord } from "@/lib/accounts";
import { coachReferences, coaches, profileViews, reports, users } from "@/db/schema";
import { getDb } from "@/db";
import { clerkSaysAdmin, getRequestViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Coach approvals",
  robots: { index: false, follow: false },
};

type Tab = "pending" | "approved" | "suspended";

export default function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  return (
    <Suspense fallback={<main className="admin">Loading the queue…</main>}>
      <Queue searchParams={searchParams} />
    </Suspense>
  );
}

function formatWhen(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Indiana/Indianapolis",
  }).format(value);
}

async function Queue({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await connection();
  const viewer = await getRequestViewer();
  if (!viewer) redirect("/sign-in");
  const allowed = viewer.role === "admin" || (await clerkSaysAdmin(viewer.userId));
  if (!allowed) redirect("/");
  const adminState = await ensureAdminRecord(viewer.userId);
  const params = await searchParams;
  const tab: Tab =
    params.tab === "approved" || params.tab === "suspended" ? params.tab : "pending";
  const db = getDb();
  if (!db || adminState === "no-db") {
    return (
      <main className="admin">
        <h1>Coach approvals</h1>
        <p>Connect Neon (`DATABASE_URL`) before the queue can load. No coach records are shown.</p>
      </main>
    );
  }

  const [coachRows, referenceRows, reportRows, viewRows] = await Promise.all([
    db
      .select({
        userId: coaches.userId,
        fullName: coaches.fullName,
        teamName: coaches.teamName,
        organization: coaches.organization,
        agesCoached: coaches.agesCoached,
        yearsExperience: coaches.yearsExperience,
        state: coaches.state,
        county: coaches.county,
        verifyUrl: coaches.verifyUrl,
        useNote: coaches.useNote,
        status: coaches.status,
        statusReason: coaches.statusReason,
        checklistTeamPage: coaches.checklistTeamPage,
        checklistOrg: coaches.checklistOrg,
        checklistConduct: coaches.checklistConduct,
        infoRequestNote: coaches.infoRequestNote,
        dailyContactCount: coaches.dailyContactCount,
        createdAt: coaches.createdAt,
        email: users.email,
        phone: users.phone,
      })
      .from(coaches)
      .innerJoin(users, eq(users.id, coaches.userId))
      .orderBy(desc(coaches.createdAt)),
    db
      .select({
        coachId: coachReferences.coachId,
        name: coachReferences.name,
        role: coachReferences.role,
        teamOrg: coachReferences.teamOrg,
        contact: coachReferences.contact,
      })
      .from(coachReferences),
    db
      .select({
        id: reports.id,
        reason: reports.reason,
        createdAt: reports.createdAt,
        status: reports.status,
        coachName: coaches.fullName,
        coachStatus: coaches.status,
      })
      .from(reports)
      .innerJoin(coaches, eq(coaches.userId, reports.coachId))
      .orderBy(desc(reports.createdAt)),
    db
      .select({ coachId: profileViews.coachId, total: count() })
      .from(profileViews)
      .groupBy(profileViews.coachId),
  ]);

  const views = new Map(viewRows.map((row) => [row.coachId, Number(row.total)]));
  const counts = {
    pending: coachRows.filter((row) => row.status === "pending").length,
    approved: coachRows.filter((row) => row.status === "approved").length,
    suspended: coachRows.filter((row) => row.status === "suspended" || row.status === "denied").length,
  };
  const visible = coachRows.filter((row) => {
    if (tab === "pending") return row.status === "pending";
    if (tab === "approved") return row.status === "approved";
    return row.status === "suspended" || row.status === "denied";
  });

  return (
    <main className="admin">
      <h1>Coach approvals</h1>
      <p className="meta">
        Hand-approve every coach before they can see profiles. Email and phone on this screen are for
        your review only. They are not shown to parents or on player pages.
      </p>
      <div className="reports">
        <h3>Reports</h3>
        {reportRows.length === 0 ? (
          <p className="meta" style={{ margin: 0 }}>
            No reports yet. When a parent files one, that coach is suspended in the same step.
          </p>
        ) : (
          reportRows.map((report) => (
            <p key={report.id} className="meta">
              <b>
                Parent report · {formatWhen(report.createdAt)} · {report.status}
              </b>{" "}
              — {report.coachName} ({report.coachStatus}). {report.reason}
            </p>
          ))
        )}
      </div>
      <div className="admin-tabs">
        <Link className={tab === "pending" ? "on" : ""} href="/admin?tab=pending">
          Pending ({counts.pending})
        </Link>
        <Link className={tab === "approved" ? "on" : ""} href="/admin?tab=approved">
          Approved ({counts.approved})
        </Link>
        <Link className={tab === "suspended" ? "on" : ""} href="/admin?tab=suspended">
          Suspended / Denied ({counts.suspended})
        </Link>
      </div>
      <div className="admin-grid">
        {visible.length === 0 ? <p className="meta">No coaches in this bucket.</p> : null}
        {visible.map((coach) => {
          const refs = referenceRows.filter((ref) => ref.coachId === coach.userId);
          const badge =
            coach.status === "approved" ? "badge-ok" : coach.status === "pending" ? "badge-pend" : "badge-bad";
          return (
            <article className="coach-card" key={coach.userId}>
              <h3>
                {coach.fullName} <span className={`status-badge ${badge}`}>{coach.status}</span>
              </h3>
              <p className="meta">
                {coach.teamName} · {coach.organization} · {coach.agesCoached}
                {coach.yearsExperience != null ? ` · ${coach.yearsExperience} years` : ""}
              </p>
              <p className="meta">
                {coach.state} · {coach.county} County · submitted {formatWhen(coach.createdAt)}
              </p>
              <p className="meta">
                {coach.email}
                {coach.phone ? ` · ${coach.phone}` : ""}
              </p>
              <p className="meta">
                Verify:{" "}
                <a href={coach.verifyUrl} target="_blank" rel="noreferrer">
                  {coach.verifyUrl}
                </a>
              </p>
              <p className="meta">
                <b>Why:</b> {coach.useNote}
              </p>
              {refs.map((ref) => (
                <p className="meta" key={`${ref.name}-${ref.contact}`}>
                  Reference: {ref.name} · {ref.role} · {ref.teamOrg} · {ref.contact} (on file)
                </p>
              ))}
              {coach.status === "pending" ? (
                <>
                  <form className="checklist" action={updateChecklist}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Verification checklist</div>
                    <input type="hidden" name="coachId" value={coach.userId} />
                    <label>
                      <input type="checkbox" name="teamPage" defaultChecked={coach.checklistTeamPage} /> Team
                      page checked
                    </label>
                    <label>
                      <input type="checkbox" name="org" defaultChecked={coach.checklistOrg} /> Organization
                      confirmed
                    </label>
                    <label>
                      <input type="checkbox" defaultChecked={coach.checklistConduct} disabled /> Code of conduct
                      agreed
                    </label>
                    <button className="btn-info" type="submit">
                      Save checklist
                    </button>
                  </form>
                  {coach.infoRequestNote ? (
                    <p className="meta">
                      <b>Ask-for-info note (not emailed yet):</b> {coach.infoRequestNote}
                    </p>
                  ) : null}
                  <div className="coach-actions">
                    <form action={updateCoachStatus}>
                      <input type="hidden" name="coachId" value={coach.userId} />
                      <input type="hidden" name="status" value="approved" />
                      <button className="btn-approve" type="submit">
                        Approve
                      </button>
                    </form>
                    <form action={updateCoachStatus}>
                      <input type="hidden" name="coachId" value={coach.userId} />
                      <input type="hidden" name="status" value="denied" />
                      <input
                        className="reason-input"
                        name="reason"
                        placeholder="Deny reason"
                        aria-label="Deny reason"
                      />
                      <button className="btn-deny" type="submit">
                        Deny
                      </button>
                    </form>
                  </div>
                  <form className="form-actions" action={askForInfo}>
                    <input type="hidden" name="coachId" value={coach.userId} />
                    <input name="note" placeholder="What else do you need?" aria-label="Request more info" />
                    <button className="btn-info" type="submit">
                      Save info request
                    </button>
                  </form>
                  <p className="meta">Email to the coach waits on Resend. This only stores the note.</p>
                </>
              ) : null}
              {coach.status === "approved" ? (
                <>
                  <div className="stats-row">
                    <span className="stat">Contact requests today: {coach.dailyContactCount}/10</span>
                    <span className="stat">Profiles viewed: {views.get(coach.userId) ?? 0}</span>
                  </div>
                  <form className="coach-actions" action={updateCoachStatus}>
                    <input type="hidden" name="coachId" value={coach.userId} />
                    <input type="hidden" name="status" value="suspended" />
                    <input
                      className="reason-input"
                      name="reason"
                      placeholder="Suspend reason"
                      aria-label="Suspend reason"
                    />
                    <button className="btn-suspend" type="submit">
                      Suspend
                    </button>
                  </form>
                </>
              ) : null}
              {coach.status === "denied" || coach.status === "suspended" ? (
                <>
                  <p className="meta">
                    <b>Reason:</b> {coach.statusReason ?? "—"}
                  </p>
                  <form action={updateCoachStatus}>
                    <input type="hidden" name="coachId" value={coach.userId} />
                    <input type="hidden" name="status" value="approved" />
                    <button className="btn-approve" type="submit">
                      Re-approve
                    </button>
                  </form>
                </>
              ) : null}
            </article>
          );
        })}
      </div>
    </main>
  );
}
