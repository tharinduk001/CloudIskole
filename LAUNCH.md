# Launch checklist

Everything built (Phases 1–7) is done and verified locally. This is what's
left to go from "runs on my machine" to a real production deployment at your
domain. Nothing here needs more code — it's account creation, configuration,
and one deploy.

## 1. Accounts to create

| Service | For | Cost |
|---|---|---|
| [Vercel](https://vercel.com) | Hosting | Free (Hobby) until you take real payments, then $20/mo Pro — Hobby's terms exclude commercial use |
| [Supabase](https://supabase.com) | Postgres, Auth, Storage | Free until ~500MB DB / 50k MAU, then $25/mo Pro |
| [Google Cloud Console](https://console.cloud.google.com) | OAuth client for "Continue with Google" | Free |
| [Resend](https://resend.com) | Transactional email (OTP, notifications) | Free (3,000/mo) |
| [text.lk](https://text.lk) | SMS (phone OTP, reminders) | Rs 0.79/SMS — top up ~Rs 1,000 |
| [Upstash](https://upstash.com) | Rate limiting (Redis) | Free |
| [Sentry](https://sentry.io) | Error tracking | Free (5k events/mo) |
| A domain registrar | `cloudiskole.lk` or similar | ~$12–20/yr |

You already have the Vercel + Supabase Hobby/free tiers question answered:
free tiers work fine right up until this is a real commercial product taking
payments, at which point Vercel's ToS requires Pro.

## 2. Supabase production project

1. Create a new project in the Supabase dashboard. Pick the region closest to
   Sri Lanka (Singapore is typically lowest latency).
2. Link and push the schema:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   This applies every migration in `supabase/migrations/` in order — the same
   ones already proven against 145 RLS assertions locally.
3. Do **not** run `supabase/seed.sql` against production — it's sample course
   data for local dev only.
4. **Paste both email templates into the dashboard** — the stock templates
   email a clickable link; the sign-in UI asks for a 6-digit code, so codes
   won't arrive without this:
   - `supabase/templates/magic_link.html` → Authentication → Emails → Magic
     Link (every sign-in after the first).
   - `supabase/templates/confirmation.html` → Authentication → Emails →
     Confirm signup (the *first* sign-in from a new address, since it also
     creates the account — a separate template from Magic Link, easy to miss).
4b. **Set Email OTP length to 6** under Authentication → Providers → Email (or
   Authentication → Settings). `supabase/config.toml`'s `otp_length = 6` only
   governs the local CLI stack — a hosted project keeps its own platform
   default until you set this explicitly, which won't match the 6-digit input
   on the sign-in form.
5. Authentication → URL Configuration: set the Site URL to your production
   domain and add it (plus any Vercel preview domain pattern) to the redirect
   allow-list. This is the "Supabase Auth redirect allowlist restricted to
   production + preview domains only" item from the security model — an open
   allow-list lets a third party redirect your OAuth flow to their own site.
6. Storage buckets are created by the migrations already (`payment-slips`,
   `course-assets`, `certificates`, `avatars`) with their RLS policies. Verify
   in Storage → Policies that all four exist.
7. Copy the project URL, anon/publishable key, and service-role key — you'll
   need them for step 4.

## 3. Google OAuth

1. In Google Cloud Console, create an OAuth 2.0 Client ID (Web application).
2. Authorized redirect URI: `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`.
3. Paste the client ID and secret into Supabase → Authentication → Providers
   → Google.
4. Add `https://<your-domain>/auth/callback` under your own app's allowed
   redirect list too (step 2.5 above already covers this if you used the real
   domain).

## 4. Environment variables (Vercel)

Set these in Vercel → Project → Settings → Environment Variables. `.env.example`
documents every one with what it's for:

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Your production domain, no trailing slash |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings — **secret** |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Resend dashboard, after domain verification |
| `TEXTLK_API_TOKEN`, `TEXTLK_SENDER_ID` | text.lk dashboard |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis database — enables the rate limiting added in Phase 7; without these the app still works, it's just unlimited |
| `CRON_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry project settings — enables error tracking added in Phase 7; without it the app runs identically, just unmonitored |
| `SENTRY_AUTH_TOKEN` | Only needed if you later wire `withSentryConfig` for source-map upload (not done yet — see §8) |

Resend requires verifying your sending domain (adds a few DNS records) before
`RESEND_FROM_EMAIL` will actually deliver — do this before relying on
notification emails in production.

## 5. First deploy

1. Import the GitHub repo into Vercel (or `vercel --prod` from the CLI).
2. Framework preset: Next.js. No build command changes needed.
3. Deploy. The CI workflow (`.github/workflows/ci.yml`) already runs on every
   push to `main` — typecheck, lint, format check, a placeholder build, and a
   full second job that spins up local Supabase in Docker and runs the RLS
   suite plus the Playwright e2e suite. Keep that green before merging to
   `main`.

## 6. Domain and DNS

1. Add the domain in Vercel → Project → Settings → Domains.
2. Point your registrar's DNS at Vercel per their instructions (usually an A
   record to Vercel's IP or a CNAME for a subdomain).
3. Vercel issues the TLS certificate automatically once DNS resolves.
4. Update `NEXT_PUBLIC_SITE_URL`, the Supabase redirect allow-list, and the
   Google OAuth redirect URIs to the final domain if you used a placeholder
   during setup.

## 7. Promote your first admin

`admin_set_user_role()` requires an existing admin to call it, so the very
first one is set directly from the Supabase SQL editor after you've signed up
once through the real site:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Every admin role change after this one goes through `admin_set_user_role()`
and is audited — this bootstrap step is the only exception, by necessity.

## 8. Scheduled jobs (notifications, session reminders)

The notification outbox and session-reminder worker live at
`POST /api/cron/notifications`, gated by `CRON_SECRET`. Vercel Hobby caps
built-in crons at once a day, which is too slow for OTP-adjacent sends, so
this is driven by GitHub Actions instead:

```yaml
# .github/workflows/notifications-cron.yml
name: Notification outbox
on:
  schedule:
    - cron: "*/5 * * * *" # every 5 minutes
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -sf -X POST https://<your-domain>/api/cron/notifications \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Add `CRON_SECRET` as a GitHub Actions repository secret (Settings → Secrets
and variables → Actions) with the same value you set in Vercel. This file
doesn't exist yet — add it once the domain is live, since it needs a real
production URL to hit.

## 9. Sentry (optional but recommended before real traffic)

Error tracking is already wired (`src/instrumentation.ts`,
`src/instrumentation-client.ts`, both error boundaries) and no-ops without a
DSN. To turn it on:

1. Create a Sentry project (platform: Next.js).
2. Set `NEXT_PUBLIC_SENTRY_DSN` in Vercel to the DSN it gives you.
3. Optional, later: run `npx @sentry/wizard@latest -i nextjs` to wire
   `withSentryConfig` in `next.config.ts` for source-map upload, so stack
   traces in Sentry show your actual source instead of minified output. This
   needs `SENTRY_AUTH_TOKEN` and your org/project slugs, which is why it's
   left for you to run once the Sentry project exists — the wizard will ask
   questions only you can answer.

## 10. Post-launch verification

Once deployed to the real domain, run through this by hand once:

- [ ] Sign up with a real email, confirm the OTP arrives (check Resend's
      dashboard if it doesn't).
- [ ] Sign in with Google.
- [ ] Enrol in a free course, complete a lesson, confirm progress updates.
- [ ] Start a paid enrollment, upload a slip, approve it as admin, confirm the
      enrollment and `payment_events` chain (Supabase Studio → Table Editor).
- [ ] Take a quiz, confirm grading and the leaderboard update.
- [ ] Register for a session, confirm the reminder cron fires (check
      `notifications` table `status` moves to `sent`).
- [ ] Finish a course, confirm a certificate issues and `/verify/<code>`
      resolves publicly.
- [ ] Run [PageSpeed Insights](https://pagespeed.web.dev) against the live
      home page and a course page — this repo's sandbox can't launch Chrome
      headlessly to run Lighthouse locally (verified: `chrome-launcher` fails
      to spawn in this environment), so the real Lighthouse pass has to
      happen against the live deployment. Target ≥95 performance, 100
      accessibility, LCP <1.5s.
- [ ] Trigger a real error (e.g. temporarily break an env var) and confirm it
      shows up in Sentry.
- [ ] Confirm Supabase's automatic daily backups are enabled (Pro plan only —
      the free tier has no backups; budget for Pro before this is anyone's
      only copy of real user data).

## What's already done and doesn't need repeating

- Full schema + RLS on every table, proven by 145 adversarial assertions
  (`npm run db:test`).
- Rate limiting on auth OTP, phone OTP, quiz submit, and the contact form
  (fails open without Upstash configured — dev works, prod should configure
  it).
- Security headers + per-request CSP with nonces (`next.config.ts`,
  `src/proxy.ts`).
- Constant-time comparison on the cron shared secret.
- Playwright e2e suite covering sign-up, sign-in redirect, free enrollment,
  and the contact form (`npm run test:e2e`) — wired into CI.
- Error boundaries at every level, reporting to Sentry once configured.
- Secret-leak guard in CI (`npm run guard:secrets`) — fails the build if a
  server-only key becomes reachable from client code.
