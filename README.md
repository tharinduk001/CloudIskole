# CloudIskole

Cloud, DevOps and Software Engineering training for Sri Lankan students after A/Ls.

Next.js 16 · React 19 · Tailwind v4 · Supabase (Postgres + Auth + Storage) · TypeScript strict.

---

## Running locally

Requires Node 20.9+ and Docker Desktop.

```bash
npm install
npx supabase start          # starts Postgres, Auth, Storage in Docker
npm run db:reset            # applies all migrations
npm run dev                 # http://localhost:3000
```

`.env.local` is already pointed at the local Supabase stack. Emails (sign-in
codes) are caught by Mailpit at <http://127.0.0.1:54324> — nothing leaves your
machine. Supabase Studio is at <http://127.0.0.1:54323>.

## Scripts

| Command                 | What it does                                        |
| ----------------------- | --------------------------------------------------- |
| `npm run dev`           | Dev server                                          |
| `npm run build`         | Production build (fails on type errors)             |
| `npm run check`         | typecheck + lint + secret guard                     |
| `npm run db:reset`      | Drop and reapply every migration                    |
| `npm run db:test`       | **Adversarial RLS suite — run after any migration** |
| `npm run db:types`      | Regenerate `database.types.ts` from the live schema |
| `npm run guard:secrets` | Fail if a server-only key can reach the browser     |
| `npm run test:e2e`      | Playwright suite on the critical flows              |

## Security model

Three things are worth knowing before changing anything under `supabase/`:

**RLS grants rows, not columns.** A student owns their profile row, so a
row-level policy alone would let them `PATCH role=admin`. The column-level
`GRANT`s in `20260719001000_grants.sql` are the actual boundary. Role changes go
through `admin_set_user_role()`, which audits them.

**`payment_events` and `audit_logs` are append-only.** A statement-level trigger
rejects `UPDATE` and `DELETE` — verified in the test suite to hold even against
a superuser. Never relax this to "fix" a data problem; write a compensating
event instead.

**Quiz answer keys are unreachable, not merely hidden.** `quiz_options` has no
student-readable policy at all. Papers are served by `get_quiz_paper()`, which
builds its response without ever projecting `is_correct`. Adding a student
`SELECT` policy to that table would leak every answer on the platform.

`npm run db:test` proves all of the above (50 assertions). It caught a real
privilege-escalation bug during Phase 1 — run it after every schema change.

## Going to production

1. Create a Supabase project; copy the URL, anon key and service-role key into
   your host's environment (see `.env.example`).
2. `npx supabase link --project-ref <ref>` then `npx supabase db push`.
3. **Paste both email templates in** — the stock Supabase templates email a
   clickable link, but the sign-in UI asks for a 6-digit code, so codes will
   not arrive without this:
   - `supabase/templates/magic_link.html` → Authentication → Emails → Magic Link
     (used on every sign-in after the first).
   - `supabase/templates/confirmation.html` → Authentication → Emails → Confirm
     signup (used the _first_ time an address signs in, since it's also
     creating the account — easy to miss if you only patch Magic Link).
4. **Set the email OTP length to 6** under Authentication → Providers → Email
   (or Authentication → Settings, depending on dashboard version). The
   `otp_length = 6` in `supabase/config.toml` only applies to the local CLI
   stack, not a hosted project — left on its platform default, the emailed
   code won't match the sign-in form's 6-digit input.
5. Add your Google OAuth client under Authentication → Providers, and add
   `https://<domain>/auth/callback` to the redirect allow-list.
6. Promote your first admin. `admin_set_user_role()` requires an existing admin,
   so the first one is set directly from the SQL editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

## Phase status

All seven phases are complete:

- **Phase 1** — Foundation, design system, public site, auth, full schema.
- **Phase 2** — Courses, lessons, enrollment, student dashboard.
- **Phase 3** — Admin dashboard, bank-transfer payments, audit UI, notifications.
- **Phase 4** — Quizzes and exams.
- **Phase 5** — Live sessions.
- **Phase 6** — XP, streaks, badges, certificates, leaderboard.
- **Phase 7** — Rate limiting, Sentry, Playwright e2e suite, CI, security
  review, launch checklist.

**Ready to deploy — see [`LAUNCH.md`](./LAUNCH.md)** for the full path from
here to a live production domain (accounts needed, env vars, DNS, first-admin
bootstrap, post-launch verification).
