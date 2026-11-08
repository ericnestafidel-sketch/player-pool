# Player Pool

Private youth travel baseball pool. Parents list a player. Coaches Eric has approved can search. Players are shown as **Player #NNN**, with **state and county only**.

This repository is Session A: the Next.js app, the full Postgres schema, Clerk roles, the coach approval queue, and the public pages. Search, parent editing, relay email, and payments come later.

## Stack

- Next.js (App Router) on Vercel
- Neon Postgres, migrations in `drizzle/`
- Clerk for sign-in (parent, coach, admin)

Stripe and Resend are not installed yet.

## What Eric needs to provision

In the Vercel project **player-pool** on team **coach-eric**, install from the Marketplace:

1. **Neon** — creates `DATABASE_URL` (pooled). Also copy the direct connection string into `DATABASE_URL_UNPOOLED` if migrations cannot run through the pooled URL.
2. **Clerk** — creates `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

Then set the public URLs (Clerk → Paths, or Vercel env):

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/continue` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/parent` |

`NEXT_PUBLIC_*` values are read at **build** time. Set them before deploying. `DATABASE_URL` is read at runtime.

Redeploy after the keys exist. `npm run build` also succeeds with none of them set; player pages then redirect to sign-in and stay empty.

### Make your user an admin

In the Clerk dashboard, open your user → Public metadata:

```json
{ "role": "admin" }
```

Sign in and open `/admin` once. That copies `role=admin` into the `users` table. The admin link is not in the public footer.

Parents can only sign up at `/sign-up`. Coaches use `/coach/signup`, land in `pending`, and cannot open player pages until you approve them.

## Local setup

```bash
npm install
cp .env.example .env.local
# fill in Neon + Clerk, then:
npm run db:migrate
npm run dev
```

For a temporary Clerk dev instance without creating a production app first:

```bash
npx clerk@latest init
```

That writes keys into `.env.local`. Do not commit that file.

Apply the schema with:

```bash
npm run db:migrate
```

`drizzle-kit` prefers `DATABASE_URL_UNPOOLED`, then `DATABASE_URL`. The first migration creates every table, seeds the `baseball` sport, and inserts the founder counter (cap **25**).

## Routes in this session

| Route | Who |
| --- | --- |
| `/`, `/privacy`, `/terms`, `/conduct` | Public |
| `/sign-up` | Parents only |
| `/coach/signup` | Coach requirements. New coaches are `pending` |
| `/coach/search`, `/players/[id]` | Approved coaches, or the parent who owns that player |
| `/parent`, `/parent/player/[id]` | That parent |
| `/admin` | Eric (`role=admin`) — Pending / Approved / Suspended |

Next.js 16 calls the request gate `src/proxy.ts` (this used to be `middleware.ts`). It sends `X-Robots-Tag: noindex` on app routes. Public marketing pages can be indexed; player and account pages cannot.

## Safety rules already enforced

- No player name, town, street, email, or phone columns.
- Coach-visible player data goes through `toPublicPlayer` (`Player #NNN`, state, county, and baseball fields only).
- A coach in `pending`, `denied`, or `suspended` cannot open search or a player page.
- A blocked coach cannot read that parent's player (the block table is in place; the block button is later).
- A coach only sees a player with an unexpired paid row. Parents can open their own player before payment.
- Admin is the only place coach email, phone, and reference contact are rendered.

## Pricing copy

One-time payments, no auto-renew. Founders (first 25): **$15 / season** or **$36 / year**. Regular: **$25 / season** or **$60 / year**. Seasons are Spring (Jan–May), Summer (Jun–Aug), and Fall/Winter (Sep–Dec). Refunds and checkout are not built yet. Legal pages are drafts for an attorney.

## Stubbed for later sessions

- Parent create/edit, pause, delete, availability, highlights
- Coach search filters, notes, saved searches, contact relay (Resend)
- Stripe Checkout, founder checkout lock, refunds, season expiry cron
- Report button (the `reports` table is ready; filing one must suspend the coach in the same transaction)
