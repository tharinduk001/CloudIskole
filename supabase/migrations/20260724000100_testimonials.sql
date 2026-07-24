-- ===========================================================================
-- 0022 · Student testimonials — home page reviews widget
--
-- Same shape as partners/highlights (20260719001800_site_content.sql):
-- public read, admin-only write, editable from the site-content admin panel.
-- Deliberately just name + quote, per product decision — no rating, role, or
-- avatar fields.
-- ===========================================================================

create table public.testimonials (
  id uuid primary key default extensions.gen_random_uuid(),
  student_name text not null,
  quote text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint testimonials_quote_length check (char_length(quote) <= 600)
);

create index testimonials_sort_idx on public.testimonials (sort_order);

create trigger testimonials_touch_updated_at
  before update on public.testimonials
  for each row execute function public.tg_touch_updated_at();

insert into public.testimonials (student_name, quote, sort_order) values
  ('Kasun Perera', 'CloudIskole took me from knowing nothing about the cloud to landing my first DevOps interview in three months. The hands-on labs made all the difference.', 0),
  ('Nadeesha Silva', 'I finished my A/Ls with no clear plan. The Cloud Foundations track gave me a real direction and skills companies actually wanted.', 1),
  ('Priya Fernando', 'The live sessions and community made learning DevOps feel a lot less overwhelming. Best decision I made right after school.', 2);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.testimonials enable row level security;

create policy "testimonials: anyone reads"
  on public.testimonials for select
  to anon, authenticated
  using (true);

create policy "testimonials: admin full access"
  on public.testimonials for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on table public.testimonials to anon;
