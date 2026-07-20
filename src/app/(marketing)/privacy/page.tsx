import type { Metadata } from "next";
import Link from "next/link";

import { Clause, DraftNotice, LegalBody } from "@/components/site/legal";
import { PageHeader } from "@/components/site/page-header";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${brand.name} collects, uses and protects your personal information.`,
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy policy"
        description={`How ${brand.name} collects, uses, stores and protects your personal information.`}
      />

      <LegalBody lastUpdated="2026-07-19">
        <DraftNotice />

        <Clause title="1. Who we are">
          <p>
            {brand.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates an online learning
            platform for students in Sri Lanka. This policy explains what personal
            information we handle and why. You can reach us at{" "}
            <a href={`mailto:${brand.contact.email}`}>{brand.contact.email}</a>.
          </p>
        </Clause>

        <Clause title="2. Information we collect">
          <h3>Information you give us</h3>
          <ul>
            <li>
              <strong>Account details</strong> - your name, email address and mobile
              number when you register.
            </li>
            <li>
              <strong>Profile details</strong> - optional information such as your
              district, profile photo and the year you sat your A/Ls.
            </li>
            <li>
              <strong>Payment records</strong> - for bank transfers, the deposit slip you
              upload and the reference number issued to you. We do not collect or store
              card numbers; when card payments are introduced they will be handled
              entirely by a licensed payment provider.
            </li>
            <li>
              <strong>Messages</strong> - anything you send us through the contact form or
              by email.
            </li>
          </ul>

          <h3>Information created as you learn</h3>
          <ul>
            <li>Courses you enrol in and lessons you complete.</li>
            <li>Quiz and exam attempts, answers and marks.</li>
            <li>Sessions you register for and attend.</li>
            <li>XP, streaks and badges earned.</li>
          </ul>

          <h3>Information collected automatically</h3>
          <ul>
            <li>
              Basic technical data such as IP address, browser type and pages visited,
              used to keep the service secure and working.
            </li>
            <li>
              Security and audit records of significant actions on your account, such as
              sign-ins and payment approvals.
            </li>
          </ul>
        </Clause>

        <Clause title="3. How we use your information">
          <ul>
            <li>
              To create and operate your account and deliver the courses you enrol in.
            </li>
            <li>To record your progress, marks, badges and leaderboard position.</li>
            <li>
              To send you service messages by email and SMS - registration confirmations,
              enrolment confirmations, payment updates and session reminders.
            </li>
            <li>To verify and record payments, and to resolve payment disputes.</li>
            <li>To prevent fraud, abuse and unauthorised access.</li>
            <li>To improve our courses and the platform.</li>
          </ul>
          <p>
            We do <strong>not</strong> sell your personal information, and we do not share
            it with advertisers.
          </p>
        </Clause>

        <Clause title="4. Your choices">
          <ul>
            <li>
              <strong>Leaderboard visibility</strong> - appearing on the public
              leaderboard is optional and off unless you choose it. You can change this at
              any time in your profile.
            </li>
            <li>
              <strong>Marketing messages</strong> - you may opt out at any time. Essential
              service messages about your account, enrolments and payments will still be
              sent.
            </li>
            <li>
              <strong>Access, correction and deletion</strong> - you may request a copy of
              your data, ask us to correct it, or ask us to delete your account by writing
              to <a href={`mailto:${brand.contact.email}`}>{brand.contact.email}</a>.
            </li>
          </ul>
          <p>
            Where we must keep records to meet financial or legal obligations - payment
            and audit records in particular - we will retain those even after an account
            is closed, and will tell you when this applies.
          </p>
        </Clause>

        <Clause title="5. Sharing with service providers">
          <p>
            We rely on a small number of providers to run the service. Each receives only
            the data needed for its function:
          </p>
          <ul>
            <li>
              <strong>Supabase</strong> - database, authentication and file storage.
            </li>
            <li>
              <strong>Vercel</strong> - website hosting and delivery.
            </li>
            <li>
              <strong>Google</strong> - if you choose to sign in with a Google account.
            </li>
            <li>
              <strong>Resend</strong> - sending transactional email.
            </li>
            <li>
              <strong>text.lk</strong> - sending SMS messages within Sri Lanka.
            </li>
            <li>
              <strong>YouTube</strong> - hosting and playing course videos.
            </li>
          </ul>
          <p>
            Some of these providers store data on servers outside Sri Lanka. We choose
            providers that apply recognised security standards.
          </p>
        </Clause>

        <Clause title="6. How we protect your information">
          <ul>
            <li>All traffic to and from the site is encrypted in transit (HTTPS).</li>
            <li>
              Access to your records is enforced at the database level, so one student
              cannot read another student&rsquo;s data.
            </li>
            <li>
              Payment slips and course materials are stored in private storage reachable
              only through short-lived, access-checked links.
            </li>
            <li>
              Payment and administrative actions are written to an append-only audit log
              that cannot be edited or deleted after the fact.
            </li>
          </ul>
          <p>
            No system is perfectly secure. If a breach affects your personal information,
            we will notify you without undue delay.
          </p>
        </Clause>

        <Clause title="7. Cookies">
          <p>
            We use cookies that are strictly necessary to run the service - principally to
            keep you signed in and to protect against cross-site request forgery. We do
            not use advertising or cross-site tracking cookies. Blocking essential cookies
            will prevent you from signing in.
          </p>
        </Clause>

        <Clause title="8. Children">
          <p>
            The platform is intended for students who have completed their G.C.E. Advanced
            Level examinations, and is not directed at children under 16. If you believe a
            child under 16 has registered, contact us and we will remove the account.
          </p>
        </Clause>

        <Clause title="9. Changes to this policy">
          <p>
            We may update this policy as the service develops. The date at the top of this
            page always reflects the current version, and we will notify registered users
            by email of any material change.
          </p>
        </Clause>

        <Clause title="10. Contact">
          <p>
            Questions about this policy or your data can be sent to{" "}
            <a href={`mailto:${brand.contact.email}`}>{brand.contact.email}</a>, or
            through our <Link href="/contact">contact page</Link>.
          </p>
        </Clause>
      </LegalBody>
    </>
  );
}
