# PlayMarket MVP

Polymarket-style prediction market using **play money points**.

## Stack

- Next.js (App Router)
- Tailwind CSS
- Supabase (Auth + Postgres)
- Vercel-ready deployment

## MVP Features

- Email/password auth
- Users start with 100 points
- Create yes/no markets
- Bet points on yes/no
- Parimutuel payout on resolution
- Auto close markets when close date passes
- Admin manual resolution (`/admin`)
- Automatic payout distribution after resolution
- Leaderboard by points
- User profile stats (points, bets, accuracy)
- Feed page with trending/new/category filters

## Anti-abuse

- Max bet = 20% of current balance (enforced in SQL function `place_bet`)
- Market create rate limit: max 5 markets per user per hour (app layer)

## Project Structure

- `/app` - routes, server actions, API route
- `/components` - UI components
- `/lib` - Supabase clients/auth/helpers
- `/supabase/migrations` - SQL schema + functions + RLS
- `/supabase/seed.sql` - example markets

## Database Tables

- `users`
- `markets`
- `bets`
- `transactions`
- `market_resolutions`

Plus helper views:

- `market_pools`
- `user_stats`

## Setup

1. Install dependencies

```bash
npm install
```

2. Create `.env.local`

```bash
cp .env.example .env.local
```

Set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS` (comma-separated admin emails)
- `CRON_SECRET` (optional, for cron endpoint auth)

3. Apply SQL migration in Supabase SQL editor:

- `supabase/migrations/202602230001_init.sql`

4. Seed example markets (after at least one user signs up):

- `supabase/seed.sql`

5. Start dev server

```bash
npm run dev
```

## Admin Flow

- Add your email to `ADMIN_EMAILS`
- Visit `/admin`
- Resolve closed markets as `YES` or `NO`
- Payouts are distributed automatically from total pool proportionally to winning stake

## Auto-close Markets

Two mechanisms:

- `close_expired_markets()` called during page rendering
- Optional cron endpoint: `POST /api/cron/close-markets`

If `CRON_SECRET` is set, pass header:

```text
Authorization: Bearer <CRON_SECRET>
```

## Deploy to Vercel

1. Push repository to GitHub
2. Import project in Vercel
3. Add all env vars from `.env.local`
4. Deploy
5. (Optional) Add Vercel Cron job to call `/api/cron/close-markets`

## Notes

- This MVP uses play points only, no real money.
- Resolution permissions are controlled by `ADMIN_EMAILS`.
- Core business rules are enforced in SQL functions for consistency.
