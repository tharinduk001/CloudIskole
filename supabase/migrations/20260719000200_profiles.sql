-- ===========================================================================
-- 0002 · Profiles
--
-- One row per authenticated user, created automatically on signup. Holds the
-- application-level identity; `auth.users` remains the credential store.
-- ===========================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,

  -- Mirrored from auth.users so admin screens and joins do not need the
  -- service role to display who a student is.
  email extensions.citext not null,

  full_name text not null default '',
  avatar_url text,

  -- Sri Lankan mobile in E.164, e.g. +94771234567. Verified separately: the
  -- number is collected at signup but only OTP-checked at first enrollment,
  -- which is what keeps SMS spend down.
  phone text,
  phone_verified_at timestamptz,

  district text,
  al_year smallint,

  role public.user_role not null default 'student',

  -- Appearing on the public leaderboard is opt-in, not opt-out.
  leaderboard_opt_in boolean not null default false,
  marketing_opt_in boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_phone_e164 check (
    phone is null or phone ~ '^\+94[0-9]{9}$'
  ),
  constraint profiles_al_year_sane check (
    al_year is null or al_year between 1990 and 2100
  ),
  constraint profiles_full_name_len check (char_length(full_name) <= 120)
);

comment on column public.profiles.phone is
  'E.164 Sri Lankan mobile (+94XXXXXXXXX). Verified via SMS OTP at first enrollment.';

create unique index profiles_phone_key on public.profiles (phone) where phone is not null;
create index profiles_role_idx on public.profiles (role) where role = 'admin';

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.tg_touch_updated_at();

-- ---------------------------------------------------------------------------
-- Helper: is the current request made by an administrator?
--
-- SECURITY DEFINER is load-bearing. If this read of `profiles` were subject to
-- RLS, and a `profiles` policy called this function, Postgres would recurse
-- infinitely. Running it as the owner breaks that cycle.
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Guard: privilege and identity columns are not self-writable
--
-- A student owns their profile row and can legitimately UPDATE it, so column
-- protection cannot come from RLS alone — RLS grants access to the row, not
-- to individual columns. This trigger is the actual boundary that stops a
-- student from setting `role = 'admin'` with a hand-written PATCH request.
-- ---------------------------------------------------------------------------

create or replace function public.tg_protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Trusted server code (service_role) and direct database administration are
  -- allowed through. This is also the ONLY way to create the very first
  -- admin, since admin_set_user_role() requires an existing admin to call it:
  --
  --   update public.profiles set role = 'admin' where email = 'you@...';
  --
  -- run from the Supabase SQL editor or with the service-role key.
  if public.is_trusted_write()
     or current_user in ('postgres', 'supabase_admin', 'service_role')
  then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception
      'Roles are changed via admin_set_user_role(), not by direct update'
      using errcode = '42501';
  end if;

  -- Phone verification is proof of an OTP round-trip, never client-asserted.
  if new.phone_verified_at is distinct from old.phone_verified_at then
    raise exception 'phone_verified_at is set only by the OTP verification flow'
      using errcode = '42501';
  end if;

  -- Changing the number must invalidate any previous verification.
  if new.phone is distinct from old.phone then
    new.phone_verified_at := null;
  end if;

  if new.id is distinct from old.id or new.email is distinct from old.email then
    raise exception 'Identity columns are immutable' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.tg_protect_profile_columns();

-- ---------------------------------------------------------------------------
-- Auto-provision a profile when a user signs up
--
-- Runs inside Supabase's own signup transaction. If this raised, signup would
-- fail, so it is written to be total: every branch produces a valid row.
-- ---------------------------------------------------------------------------

create or replace function public.tg_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_avatar text;
begin
  -- Google returns `full_name`/`name` and `avatar_url`/`picture` depending on
  -- the provider version; email signups return neither.
  v_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    ''
  );
  v_avatar := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );

  perform set_config('app.trusted_write', 'on', true);

  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, left(v_name, 120), v_avatar)
  on conflict (id) do nothing;

  -- Clear the flag immediately. set_config(..., true) is TRANSACTION-scoped,
  -- not statement-scoped, so leaving it set would disable the column guards
  -- for every later statement in the same transaction.
  perform set_config('app.trusted_write', 'off', true);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.tg_handle_new_user();

-- Keep the mirrored email in step if the user changes it in auth.
create or replace function public.tg_sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    perform set_config('app.trusted_write', 'on', true);
    update public.profiles set email = new.email where id = new.id;
    perform set_config('app.trusted_write', 'off', true);
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.tg_sync_user_email();

-- ---------------------------------------------------------------------------
-- admin_set_user_role — the only supported way to change a role
--
-- Roles are not changed by UPDATE (authenticated has no column privilege on
-- `role` — see 0010). They move through here, which verifies the caller is an
-- admin and records the change in the audit log. Routing it through a function
-- means a promotion can never happen without a trace of who did it.
-- ---------------------------------------------------------------------------

create or replace function public.admin_set_user_role(
  p_user_id uuid,
  p_role public.user_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.user_role;
  v_actor uuid := (select auth.uid());
begin
  if not public.is_admin() then
    raise exception 'Only an administrator may change a user role'
      using errcode = '42501';
  end if;

  select role into v_old from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'No such user' using errcode = 'P0002';
  end if;

  if v_old = p_role then
    return;
  end if;

  -- An admin must not be able to quietly demote the last admin and lock
  -- everyone out of the payment queue.
  if v_old = 'admin' and p_role <> 'admin'
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'Cannot demote the last remaining administrator'
      using errcode = '23514';
  end if;

  perform set_config('app.trusted_write', 'on', true);
  update public.profiles set role = p_role where id = p_user_id;
  perform set_config('app.trusted_write', 'off', true);

  insert into public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, before, after)
  values (v_actor, 'admin', 'user.role_changed', 'profile', p_user_id,
          jsonb_build_object('role', v_old), jsonb_build_object('role', p_role));
end;
$$;

revoke all on function public.admin_set_user_role(uuid, public.user_role) from public;
grant execute on function public.admin_set_user_role(uuid, public.user_role)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

-- Students read and edit only their own profile.
create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Deliberately no INSERT policy: profiles are created only by the signup
-- trigger. Deliberately no DELETE policy: accounts are removed via auth.users,
-- which cascades here.

create policy "profiles: admin reads all"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "profiles: admin updates all"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
