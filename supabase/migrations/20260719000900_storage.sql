-- ===========================================================================
-- 0009 · Storage buckets and object policies
--
-- Supabase Storage enforces RLS on `storage.objects`, so the same auth model
-- that protects rows protects files. Object paths are structured so that the
-- first path segment carries the owner or course identity, which is what the
-- policies below match against.
--
--   avatars/<user_id>/<file>
--   payment-slips/<user_id>/<order_id>/<file>
--   course-assets/<course_id>/<file>
--   certificates/<user_id>/<file>
--   session-covers/<file>
-- ===========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  -- Public: profile pictures are shown on the leaderboard and comments.
  ('avatars', 'avatars', true, 2 * 1024 * 1024,
   array['image/jpeg', 'image/png', 'image/webp']),

  -- PRIVATE. Bank deposit slips are financial documents containing account
  -- details. Reachable only by the uploader and staff, via signed URLs.
  ('payment-slips', 'payment-slips', false, 5 * 1024 * 1024,
   array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),

  -- PRIVATE. Course PDFs and downloads: the paid product.
  ('course-assets', 'course-assets', false, 50 * 1024 * 1024,
   array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/zip']),

  -- PRIVATE. Generated certificates, served through signed URLs.
  ('certificates', 'certificates', false, 5 * 1024 * 1024,
   array['application/pdf']),

  -- Public: session cover images used on the marketing listing.
  ('session-covers', 'session-covers', true, 5 * 1024 * 1024,
   array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- avatars — public read, owner writes only inside their own folder
-- ---------------------------------------------------------------------------

create policy "avatars: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "avatars: owner writes own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars: owner updates own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars: owner deletes own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- payment-slips — owner uploads, owner and staff read, NOBODY overwrites
--
-- There is intentionally no UPDATE or DELETE policy for students. A deposit
-- slip is evidence in a financial dispute; once submitted it must not be
-- swapped for a different image or removed.
-- ---------------------------------------------------------------------------

create policy "payment-slips: owner uploads own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'payment-slips'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "payment-slips: owner reads own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'payment-slips'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "payment-slips: admin reads all"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'payment-slips' and public.is_admin());

-- ---------------------------------------------------------------------------
-- course-assets — readable only by students enrolled in that course
--
-- The first folder segment is the course id, so enrollment is checked against
-- the file's own path. A signed URL for one course's PDF cannot be minted by
-- a student enrolled only in another.
-- ---------------------------------------------------------------------------

create policy "course-assets: enrolled students read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'course-assets'
    and public.is_enrolled(((storage.foldername(name))[1])::uuid)
  );

create policy "course-assets: admin full access"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'course-assets' and public.is_admin())
  with check (bucket_id = 'course-assets' and public.is_admin());

-- ---------------------------------------------------------------------------
-- certificates — owner reads; only staff/service role writes
-- ---------------------------------------------------------------------------

create policy "certificates: owner reads own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "certificates: admin full access"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'certificates' and public.is_admin())
  with check (bucket_id = 'certificates' and public.is_admin());

-- ---------------------------------------------------------------------------
-- session-covers — public read, staff write
-- ---------------------------------------------------------------------------

create policy "session-covers: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'session-covers');

create policy "session-covers: admin writes"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'session-covers' and public.is_admin())
  with check (bucket_id = 'session-covers' and public.is_admin());
