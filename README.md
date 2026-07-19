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
3. **Paste `supabase/templates/magic_link.html` into Authentication → Emails →
   Magic Link.** The stock Supabase template emails a clickable link, but the
   sign-in UI asks for a 6-digit code, so codes will not arrive without this.
4. Add your Google OAuth client under Authentication → Providers, and add
   `https://<domain>/auth/callback` to the redirect allow-list.
5. Promote your first admin. `admin_set_user_role()` requires an existing admin,
   so the first one is set directly from the SQL editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

## Phase status

- **Phase 1 — done.** Foundation, design system, public site, auth, full schema.
- Phase 2 — courses, lessons, enrollment, student dashboard.
- Phase 3 — admin dashboard, bank-transfer payments, audit UI, notifications.
- Phase 4 — quizzes and exams. Phase 5 — live sessions.
- Phase 6 — XP, leaderboards, certificates. Phase 7 — hardening and launch.
