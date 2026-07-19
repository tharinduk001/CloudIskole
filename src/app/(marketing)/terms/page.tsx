import type { Metadata } from "next";
import Link from "next/link";

import { Clause, DraftNotice, LegalBody } from "@/components/site/legal";
import { PageHeader } from "@/components/site/page-header";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description: `The terms that govern your use of ${brand.name}.`,
};

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms & conditions"
        description={`The agreement between you and ${brand.name} when you use this platform.`}
      />

      <LegalBody lastUpdated="2026-07-19">
        <DraftNotice />

        <Clause title="1. Agreement">
          <p>
            By creating an account or using {brand.name}, you agree to these terms. If you
            do not agree, please do not use the platform. You must be at least 16 years
            old to register.
          </p>
        </Clause>

        <Clause title="2. Your account">
          <ul>
            <li>
              You must give accurate registration details, including a mobile number you
              control, and keep them up to date.
            </li>
            <li>
              Your account is personal to you. Sharing your login, or letting another
              person use your enrolment, is not permitted.
            </li>
            <li>
              You are responsible for activity under your account. Tell us immediately if
              you suspect unauthorised access.
            </li>
          </ul>
        </Clause>

        <Clause title="3. Enrolment and access">
          <ul>
            <li>
              Free courses are available at no cost for as long as we offer them. We may
              change or withdraw a free course at any time.
            </li>
            <li>
              Paid courses grant you personal access from the date your payment is
              confirmed. Unless stated otherwise on the course page, access does not
              expire.
            </li>
            <li>
              We may update course content, replace lessons, or reschedule sessions to
              keep material current.
            </li>
          </ul>
        </Clause>

        <Clause title="4. Payments">
          <ul>
            <li>All fees are quoted and payable in Sri Lankan Rupees (LKR).</li>
            <li>
              Payment is currently made by bank transfer. You will receive a unique
              reference number and our bank details, and you must upload your deposit slip
              so we can match the payment.
            </li>
            <li>
              Enrolment is activated only after we confirm receipt of funds. This is
              normally within one to two working days.
            </li>
            <li>
              Using the wrong reference number may delay activation. If a transfer cannot
              be matched to an order, we will contact you.
            </li>
            <li>
              Every payment, including failed and rejected ones, is recorded in an
              append-only log. You may request a statement of your payment history at any
              time.
            </li>
          </ul>
          <p>
            Refunds are governed by our{" "}
            <Link href="/refunds">refunds &amp; returns policy</Link>.
          </p>
        </Clause>

        <Clause title="5. Acceptable use">
          <p>You agree not to:</p>
          <ul>
            <li>
              Share, resell, re-upload or publicly post course videos, notes, quizzes or
              any other material from the platform.
            </li>
            <li>
              Attempt to obtain quiz or exam answers other than by taking the assessment
              honestly, or help another person to do so.
            </li>
            <li>
              Interfere with the platform&rsquo;s security, attempt to access other
              users&rsquo; data, or probe our systems without written permission.
            </li>
            <li>Use automated tools to scrape content or create accounts in bulk.</li>
            <li>Harass, abuse or impersonate other students, instructors or staff.</li>
          </ul>
          <p>
            We may suspend or terminate an account that breaches these rules. Where a
            breach involves cheating, we may additionally void the affected marks, badges
            and leaderboard position.
          </p>
        </Clause>

        <Clause title="6. Intellectual property">
          <p>
            All course material on the platform — videos, written lessons, slides,
            exercises and assessments — remains our property or that of its licensors.
            Your enrolment gives you a personal, non-transferable licence to use that
            material for your own learning. It does not transfer ownership or permit
            redistribution.
          </p>
          <p>
            Content you submit remains yours, but you grant us the licence needed to store
            and display it in order to operate the service.
          </p>
        </Clause>

        <Clause title="7. Badges">
          <p>
            Badges confirm that you met a specific achievement — completing a course,
            passing an exam, maintaining a streak. They are not an academic qualification,
            are not accredited by any university or government body, and do not guarantee
            employment. We may revoke a badge obtained through cheating or
            misrepresentation. Digital credentials issued through a third-party platform
            (such as credentials.certdirectory.io) are governed separately by that
            platform&rsquo;s own terms.
          </p>
        </Clause>

        <Clause title="8. Live sessions">
          <p>
            Session times are given in Sri Lanka Standard Time. We may reschedule or
            cancel a session; where we do, registered students are notified and, for paid
            sessions, offered a recording or an alternative date. Sessions may be recorded
            and made available to enrolled students.
          </p>
        </Clause>

        <Clause title="9. Availability">
          <p>
            We work to keep the platform available at all times, but we do not guarantee
            uninterrupted service. Access may be interrupted for maintenance, or by
            failures in networks and third-party providers outside our control.
          </p>
        </Clause>

        <Clause title="10. Limitation of liability">
          <p>
            To the fullest extent permitted by Sri Lankan law, our total liability arising
            from your use of the platform is limited to the amount you paid us in the
            twelve months before the claim. We are not liable for indirect or
            consequential loss, including loss of employment, income or opportunity.
          </p>
          <p>
            Nothing in these terms excludes liability that cannot lawfully be excluded.
          </p>
        </Clause>

        <Clause title="11. Termination">
          <p>
            You may close your account at any time by contacting us. We may suspend or
            close an account that breaches these terms. Where we close a paid account
            without cause, we will refund the unused portion of any fee on a fair basis.
          </p>
        </Clause>

        <Clause title="12. Governing law">
          <p>
            These terms are governed by the laws of the Democratic Socialist Republic of
            Sri Lanka, and the courts of Sri Lanka have exclusive jurisdiction over any
            dispute.
          </p>
        </Clause>

        <Clause title="13. Contact">
          <p>
            Questions about these terms can be sent to{" "}
            <a href={`mailto:${brand.contact.email}`}>{brand.contact.email}</a>.
          </p>
        </Clause>
      </LegalBody>
    </>
  );
}
