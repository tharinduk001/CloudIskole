-- ===========================================================================
-- 0019 · Founder certifications — provider, badge image, dates, verify link
--
-- The certifications list started as bare labels; this brings in the real
-- Credly/Microsoft/CertDirectory badge data (issuer, dates, artwork, a
-- verification link) so the about page can render actual credential cards
-- instead of plain text pills.
-- ===========================================================================

alter table public.founder_certifications
  add column provider text,
  add column badge_image_url text,
  add column issued_date date,
  add column expiry_date date,
  add column verify_url text;

-- Badge art comes from whichever issuer hosts it (Credly, CertDirectory,
-- Microsoft has none) — unlike founder_profile/partners/highlights, this is
-- deliberately not restricted to res.cloudinary.com.
alter table public.founder_certifications
  add constraint founder_certifications_badge_image_url_format check (
    badge_image_url is null or badge_image_url ~ '^https://'
  ),
  add constraint founder_certifications_verify_url_format check (
    verify_url is null or verify_url ~ '^https://'
  );

-- Replaces the earlier label-only seed with the full, real credential list.
truncate table public.founder_certifications;

insert into public.founder_certifications
  (label, provider, badge_image_url, issued_date, expiry_date, verify_url, sort_order)
values
  ('KCNA: Kubernetes and Cloud Native Associate', 'The Linux Foundation',
   'https://images.credly.com/images/f28f1d88-428a-47f6-95b5-7da1dd6c1000/KCNA_badge.png',
   '2026-06-02', '2028-06-02',
   'https://www.credly.com/badges/e287c67f-6abf-4f7c-bc0f-7316882c2004', 0),

  ('CertDirectory Mentor', 'CertDirectory.IO',
   'https://storage.googleapis.com/credentials-uploads-prod/badges/5a3804ab-389d-49d6-afbb-2f70962378c9/89d796b2605153cb.png',
   '2026-03-03', null,
   'https://credentials.certdirectory.io/verify/CRD-Y6GVK3YZ', 1),

  ('CertDirectory Meetup Organizer', 'CertDirectory.IO',
   'https://storage.googleapis.com/credentials-uploads-prod/badges/5a3804ab-389d-49d6-afbb-2f70962378c9/3e01da440802a0b0.png',
   '2026-02-24', null,
   'https://credentials.certdirectory.io/verify/CRD-4FEV2MQM', 2),

  ('Learnfi Certified CI/CD Pro', 'Learnfi',
   'https://storage.googleapis.com/credentials-uploads-prod/badges/822ffcaa-6816-44ee-bbfe-13bb48e8416b/7b4e912857900dd8.png',
   '2026-02-08', null,
   'https://credentials.certdirectory.io/verify/CRD-AYF5BSP2', 3),

  ('AWS Certified Cloud Practitioner', 'Amazon Web Services Training and Certification',
   'https://images.credly.com/images/00634f82-b07f-4bbd-a6bb-53de397fc3a6/image.png',
   '2026-01-05', '2029-01-05',
   'https://www.credly.com/badges/bd7b0aae-7585-4393-9608-cdb5ffb707c6', 4),

  ('Critical Career Skills - Generative AI Foundations', 'Certiport',
   'https://images.credly.com/images/c105da62-e843-4821-ba85-21a50efa099d/blob',
   '2025-12-26', '2030-12-26',
   'https://www.credly.com/badges/433498c2-7f69-4d33-a53a-c7ddf25eb974', 5),

  ('IC3 Digital Literacy Certification GS6 Level 3', 'Certiport',
   'https://images.credly.com/images/9d1c5a9d-bddd-4c0c-81ac-76c10957e723/IC3_Digital_Literacy_Levels_3.png',
   '2025-12-26', null,
   'https://www.credly.com/badges/3e19d9fd-5797-4af3-b959-e3b938f77399', 6),

  ('IC3 Digital Literacy Certification GS6 Master (All 3 levels)', 'Certiport',
   'https://images.credly.com/images/2e378894-7e9e-4de1-9e0c-083b8f9fec42/IC3_Master_600x600px.png',
   '2025-12-26', null,
   'https://www.credly.com/badges/7cbc45d1-e929-4fbf-a6b2-03833dc2f463', 7),

  ('IC3 Digital Literacy Certification GS6 Level 2', 'Certiport',
   'https://images.credly.com/images/b22962a2-d29c-478d-805e-ae50fd49bb2e/IC3_Digital_Literacy_Levels_2.png',
   '2025-12-26', null,
   'https://www.credly.com/badges/1f5dafd3-39c1-4e3f-9a40-cb8c5957840a', 8),

  ('IC3 Digital Literacy Certification GS6 Level 1', 'Certiport',
   'https://images.credly.com/images/29a6f7a3-2cf6-426c-969d-e432b44532e0/IC3_Digital_Literacy_Levels_1.png',
   '2025-10-30', null,
   'https://www.credly.com/badges/2292caaa-1e47-4fad-b827-bc515e1ec1d6', 9),

  ('Multicloud Network Associate', 'Aviatrix',
   'https://images.credly.com/images/e3c001fd-161d-433a-a7a4-049556d6112d/blob',
   '2025-09-18', '2028-09-18',
   'https://www.credly.com/badges/82361916-4cda-4d13-bac4-99ae9d67177a', 10),

  ('Microsoft Certified: Azure Fundamentals', 'Microsoft',
   null,
   '2025-07-19', null,
   'https://learn.microsoft.com/api/credentials/share/en-us/TharinduKalhara-6788/5A27BAB662EC1F4A?sharingId=37270A7AF22ABD41', 11),

  ('SKF100: Understanding the OWASP Top 10 Security Threats', 'The Linux Foundation',
   'https://images.credly.com/images/18d8c64f-cf68-4259-b0ef-2a116e9224f1/blob',
   '2025-06-08', null,
   'https://www.credly.com/badges/c996d8bc-4e4d-4322-b826-9a916ea8284f', 12),

  ('LFC101: Inclusive Speaker Orientation', 'The Linux Foundation',
   'https://images.credly.com/images/16fbd343-192a-49ee-b9b9-de7bd1d4bf17/blob',
   '2025-06-02', null,
   'https://www.credly.com/badges/56c08b32-2814-4e09-ade7-24753c6b3bb7', 13),

  ('LFS158: Introduction to Kubernetes', 'The Linux Foundation',
   'https://images.credly.com/images/4b5a8636-c554-482d-bbdc-7925fb3624c3/blob',
   '2025-06-01', null,
   'https://www.credly.com/badges/fd7adce3-9df9-48f8-83c6-1ddf348bb30d', 14),

  ('LFS101: Introduction to Linux', 'The Linux Foundation',
   'https://images.credly.com/images/97a95d07-04c3-4afb-952a-6bcf46ddb87e/blob',
   '2025-05-31', null,
   'https://www.credly.com/badges/40b91447-eee0-4ef9-ad0d-0f35f5f9e12e', 15),

  ('GitHub Foundations', 'GitHub',
   'https://images.credly.com/images/024d0122-724d-4c5a-bd83-cfe3c4b7a073/image.png',
   '2025-05-23', '2028-05-23',
   'https://www.credly.com/badges/e5512a78-8bb1-47f4-a8bb-643debf63951', 16),

  ('AWS Knowledge: Cloud Essentials', 'Amazon Web Services Training and Certification',
   'https://images.credly.com/images/7cf036b0-c609-4378-a7be-9969e1dea7ab/blob',
   '2024-11-25', null,
   'https://www.credly.com/badges/9a9258a8-806e-4e71-a7e2-0668f4ebd30d', 17),

  ('AWS Educate Introduction to Cloud 101', 'Amazon Web Services Training and Certification',
   'https://images.credly.com/images/e51a8579-188d-4363-8ed1-12ad164ef57b/blob',
   '2024-10-20', null,
   'https://www.credly.com/badges/d830c9d2-3447-42fb-9e42-a2f8f02a2c7d', 18);
