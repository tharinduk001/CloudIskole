-- ===========================================================================
-- 0018 · Site content — partners, moments photos, founder profile
--
-- Marketing content that used to live in static TypeScript files
-- (src/content/home.ts, src/content/founder.ts) so it could be edited from
-- the admin panel instead of by shipping code. All public, all read by
-- anyone; only an admin may write.
-- ===========================================================================

create table public.partners (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  logo_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint partners_logo_url_format check (
    logo_url ~ '^https://res\.cloudinary\.com/'
  )
);

create index partners_sort_idx on public.partners (sort_order);

create trigger partners_touch_updated_at
  before update on public.partners
  for each row execute function public.tg_touch_updated_at();

-- ---------------------------------------------------------------------------

create table public.highlights (
  id uuid primary key default extensions.gen_random_uuid(),
  src text not null,
  alt text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint highlights_src_format check (
    src ~ '^https://res\.cloudinary\.com/'
  )
);

create index highlights_sort_idx on public.highlights (sort_order);

create trigger highlights_touch_updated_at
  before update on public.highlights
  for each row execute function public.tg_touch_updated_at();

-- ---------------------------------------------------------------------------
-- founder_profile — a singleton row (id is always 1). One founder, one bio;
-- no reason to model this as a list the way courses or sessions are.
-- ---------------------------------------------------------------------------

create table public.founder_profile (
  id smallint primary key default 1,
  name text not null default '',
  title text not null default '',
  photo_url text not null default '',
  -- Paragraphs separated by a blank line, split at render time — same
  -- convention as course descriptions elsewhere in this schema.
  bio text not null default '',
  updated_at timestamptz not null default now(),

  constraint founder_profile_singleton check (id = 1),
  constraint founder_profile_photo_url_format check (
    photo_url = '' or photo_url ~ '^https://res\.cloudinary\.com/'
  )
);

create trigger founder_profile_touch_updated_at
  before update on public.founder_profile
  for each row execute function public.tg_touch_updated_at();

-- Deliberately no delete/insert policy is needed by the app: the single row
-- is created here and only ever updated, never removed or duplicated.
insert into public.founder_profile (id, name, title, photo_url, bio)
values (
  1,
  'Tharindu Kalhara',
  'Cloud & DevOps Platforms Engineer Intern · AWS Community Builder · Lecturer at IDET',
  'https://res.cloudinary.com/dopkcplb3/image/upload/v1784009414/hero_y0uxv0.png',
  'Tharindu is a Cloud & DevOps Platforms Engineer currently interning while completing his Bachelor of ICT (Honours) in Software Engineering at the University of Sri Jayewardenepura. He has trained more than 5,000 students and professionals across classrooms, corporate teams and the cloud-native community - and built CloudIskole to bring that same practical, hands-on training to Sri Lankan students right after their A/Ls.' || E'\n\n' ||
  'He is an AWS Community Builder, a lecturer in Cloud Operations and AWS at the Institute of Digital Engineering Technology (IDET), and a DevRel engineer at CertDirectory.io. He founded CryptX, Sri Lanka''s first island-wide Hackathon, CTF and Designathon, and has been recognised as a LinkedIn Rising Star (Sri Lanka) and a Top 10 Tech Voice in Sri Lanka.'
);

-- ---------------------------------------------------------------------------

create table public.founder_education (
  id uuid primary key default extensions.gen_random_uuid(),
  period text not null,
  institution text not null,
  detail text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index founder_education_sort_idx on public.founder_education (sort_order);

create trigger founder_education_touch_updated_at
  before update on public.founder_education
  for each row execute function public.tg_touch_updated_at();

-- ---------------------------------------------------------------------------

create table public.founder_experience (
  id uuid primary key default extensions.gen_random_uuid(),
  period text not null,
  -- Not named `role`: that reads as the `public.user_role` enum everywhere
  -- else in this schema, and this is unrelated free text (a job title).
  role_title text not null,
  org text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index founder_experience_sort_idx on public.founder_experience (sort_order);

create trigger founder_experience_touch_updated_at
  before update on public.founder_experience
  for each row execute function public.tg_touch_updated_at();

-- ---------------------------------------------------------------------------

create table public.founder_certifications (
  id uuid primary key default extensions.gen_random_uuid(),
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index founder_certifications_sort_idx on public.founder_certifications (sort_order);

-- ===========================================================================
-- Seed data — mirrors the static content this migration replaces, so the
-- marketing pages render identically the moment this ships.
-- ===========================================================================

insert into public.partners (name, logo_url, sort_order) values
  ('AWS Community Builders', 'https://res.cloudinary.com/dopkcplb3/image/upload/v1783670441/Community_Builders_logo_for_dark_background_mq3vgk.png', 0),
  ('IDET - Institute of Digital Engineering Technology', 'https://res.cloudinary.com/dopkcplb3/image/upload/v1783603855/download_bdsp4e.png', 1),
  ('FOSS Community Sri Lanka', 'https://res.cloudinary.com/dopkcplb3/image/upload/v1783602831/FOSS_epzsbf.webp', 2),
  ('IEEE CS - University of Sri Jayewardenepura', 'https://res.cloudinary.com/dopkcplb3/image/upload/v1783602879/ieee_cs_student_branch_chapter_university_of_sri_jayewardenepura_logo_evoxbp.jpg', 3),
  ('NIBM', 'https://res.cloudinary.com/dopkcplb3/image/upload/v1783602971/1778030305129_eirpic.jpg', 4),
  ('University of Moratuwa Leo Club', 'https://res.cloudinary.com/dopkcplb3/image/upload/v1783603972/leo_ztyhcn.png', 5),
  ('IEEE SB - University of Vavuniya', 'https://res.cloudinary.com/dopkcplb3/image/upload/v1783709980/ieeesbuov_logo_cxuvx8.jpg', 6);

insert into public.highlights (src, alt, sort_order) values
  ('https://res.cloudinary.com/dopkcplb3/image/upload/v1783742890/654222454_926408150252488_6231460814954891148_n_jsrc5t.jpg', 'Speaking at a University of Moratuwa tech event', 0),
  ('https://res.cloudinary.com/dopkcplb3/image/upload/v1783675783/highlights_1_kgsj5v.jpg', 'Judging the Beauty of Cloud hackathon', 1),
  ('https://res.cloudinary.com/dopkcplb3/image/upload/v1783675780/highlights_11_hao4gw.jpg', 'Leading CryptX, an island-wide hackathon and CTF', 2),
  ('https://res.cloudinary.com/dopkcplb3/image/upload/v1783742890/569976493_811777995048838_9210082039700355004_n_efyp1x.jpg', 'At Kubernetes Community Day Sri Lanka', 3),
  ('https://res.cloudinary.com/dopkcplb3/image/upload/v1783680392/741906689_2810501982647474_856743842466341450_n_mxbrmj.jpg', 'Running a cloud training session at NIBM', 4),
  ('https://res.cloudinary.com/dopkcplb3/image/upload/v1783675784/highlights_2_ibzlxn.jpg', 'On the judging panel at Beauty of Cloud', 5),
  ('https://res.cloudinary.com/dopkcplb3/image/upload/v1783742890/732610192_1598260788381984_288652173330552542_n_lyv6sx.jpg', 'Kubernetes community meetup in Colombo', 6),
  ('https://res.cloudinary.com/dopkcplb3/image/upload/v1783675781/highlights_15_hhd93y.jpg', 'FOSS Community Sri Lanka session', 7);

insert into public.founder_education (period, institution, detail, sort_order) values
  ('2023 - 2027', 'University of Sri Jayewardenepura', 'BICT (Hons) in Software Engineering, undergraduate', 0),
  ('2022 - 2023', 'University of Moratuwa', 'Trainee Full Stack Developer programme - completed all 6 courses', 1),
  ('2021', 'Richmond College, Galle', 'Engineering Technology stream - 4 A''s, 4th rank in Galle District', 2);

insert into public.founder_experience (period, role_title, org, sort_order) values
  ('2026 - Present', 'Cloud & DevOps Platforms Engineer Intern', 'N-able', 0),
  ('2026 - Present', 'Lecturer, Cloud Operations & AWS', 'IDET', 1),
  ('2025 - Present', 'DevRel Engineer', 'CertDirectory.io', 2),
  ('2022 - 2023', 'Associate', 'OREL IT', 3);

insert into public.founder_certifications (label, sort_order) values
  ('AWS Certified Cloud Practitioner', 0),
  ('KCNA: Kubernetes and Cloud Native Associate', 1),
  ('Microsoft Certified: Azure Fundamentals', 2),
  ('Multicloud Network Associate (Aviatrix)', 3),
  ('GitHub Foundations', 4),
  ('LFS158: Introduction to Kubernetes', 5),
  ('LFS101: Introduction to Linux', 6),
  ('SKF100: Understanding the OWASP Top 10 Security Threats', 7);

-- ===========================================================================
-- RLS
-- ===========================================================================

alter table public.partners enable row level security;
alter table public.highlights enable row level security;
alter table public.founder_profile enable row level security;
alter table public.founder_education enable row level security;
alter table public.founder_experience enable row level security;
alter table public.founder_certifications enable row level security;

create policy "partners: anyone reads"
  on public.partners for select
  to anon, authenticated
  using (true);

create policy "partners: admin full access"
  on public.partners for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "highlights: anyone reads"
  on public.highlights for select
  to anon, authenticated
  using (true);

create policy "highlights: admin full access"
  on public.highlights for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "founder_profile: anyone reads"
  on public.founder_profile for select
  to anon, authenticated
  using (true);

-- Only UPDATE: the single row is seeded above, never inserted or deleted by
-- the app.
create policy "founder_profile: admin updates"
  on public.founder_profile for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "founder_education: anyone reads"
  on public.founder_education for select
  to anon, authenticated
  using (true);

create policy "founder_education: admin full access"
  on public.founder_education for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "founder_experience: anyone reads"
  on public.founder_experience for select
  to anon, authenticated
  using (true);

create policy "founder_experience: admin full access"
  on public.founder_experience for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "founder_certifications: anyone reads"
  on public.founder_certifications for select
  to anon, authenticated
  using (true);

create policy "founder_certifications: admin full access"
  on public.founder_certifications for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Grants — anon has no default privileges (see 0010); each publicly-read
-- table needs an explicit grant at this layer, on top of the RLS policies
-- above.
-- ---------------------------------------------------------------------------

grant select on table
  public.partners,
  public.highlights,
  public.founder_profile,
  public.founder_education,
  public.founder_experience,
  public.founder_certifications
to anon;
