# Player Pool

Private youth travel baseball pool. Parents list a player. Coaches Eric has approved can search. Players are shown as **Player #NNN**, with **state and county only**.

Parents can create, edit, pause, and delete player profiles. Approved coaches can search, filter, save searches, and keep private notes. Relay email and payments come later.

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

Set `ADMIN_EMAILS` on Vercel (production and preview) to a comma-separated list of verified primary emails. It is server-only. Do not prefix it with `NEXT_PUBLIC_`.

Sign up at `/sign-up` with one of those emails, then open `/admin`. Player Pool checks that the primary email is verified, saves `role=admin`, and sets Clerk public metadata `{ "role": "admin" }` so it sticks. An unverified address does not match.

Setting that metadata by hand in the Clerk dashboard still works. The first visit to `/admin` copies it into Postgres. The admin link is not in the public footer.

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

`drizzle-kit` prefers `DATABASE_URL_UNPOOLED`, then `DATABASE_URL`. The first migration creates every table and seeds the `baseball` sport.

## Routes in this session

| Route | Who |
| --- | --- |
| `/`, `/privacy`, `/terms`, `/conduct` | Public |
| `/sign-up` | Parents only |
| `/coach/signup` | Coach requirements. New coaches are `pending` |
| `/coach/search`, `/players/[id]` | Approved coaches, or the parent who owns that player |
| `/parent`, `/parent/player/new`, `/parent/player/[id]` | That parent |
| `/admin` | Eric (`role=admin`) — Pending / Approved / Suspended |

Next.js 16 calls the request gate `src/proxy.ts` (this used to be `middleware.ts`). It sends `X-Robots-Tag: noindex` on app routes. Public marketing pages can be indexed; player and account pages cannot.

## Safety rules already enforced

- No player name, town, street, email, or phone columns.
- Coach-visible player data goes through `toPublicPlayer` (`Player #NNN`, state, county, and baseball fields only).
- A coach in `pending`, `denied`, or `suspended` cannot open search or a player page.
- A blocked coach cannot read that parent's player (the block table is in place; the block button is later).
- Coach search hides unpaid and expired profiles only when `REQUIRE_PAID_LISTING=true`. Until that flag is on, a profile is visible when it is not paused and not deleted. Parents can open their own player either way.
- Admin is the only place coach email, phone, and reference contact are rendered.

## Pricing copy

One-time payments, no auto-renew. Season **$25**. Yearly **$60** through December 31. Seasons are Spring (Jan–May), Summer (Jun–Aug), and Fall/Winter (Sep–Dec). The first 25 seasons are free with Stripe code **FIRST25**. A refund is available for 15 days if no coach has viewed the profile since payment. Legal pages are drafts for an attorney.

Run `npm run stripe:setup` with `STRIPE_SECRET_KEY`, then set `STRIPE_WEBHOOK_SECRET`. Set `REQUIRE_PAID_LISTING=true` at launch. `CRON_SECRET` protects the daily expiry check.

Approved coaches message parents from a player profile. Parents reply in `/parent/inbox`. Neither side sees the other's email or phone. If `RESEND_API_KEY` and `NOTIFY_FROM_EMAIL` are set, each new message also sends a notice with a link and no message body. A parent can block or report a coach from a thread or the viewed list. A report suspends that coach until Eric reinstates them on `/admin`.
