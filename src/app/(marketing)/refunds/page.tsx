import type { Metadata } from "next";
import Link from "next/link";

import { Clause, DraftNotice, LegalBody } from "@/components/site/legal";
import { PageHeader } from "@/components/site/page-header";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Refunds & returns",
  description: `When you can get a refund from ${brand.name}, how to request one, and how long it takes.`,
};

export default function RefundsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Refunds & returns"
        description="When you can get your money back, how to ask, and how long it takes."
      />

      <LegalBody lastUpdated="2026-07-19">
        <DraftNotice />

        <Clause title="1. The short version">
          <p>
            If a paid course is not what you expected, tell us within{" "}
            <strong>7 days</strong> of enrolling and before you have completed more than{" "}
            <strong>25%</strong> of its lessons, and we will refund you in full. Beyond
            that, refunds are considered case by case.
          </p>
          <p>
            Because our courses are digital, there is nothing to physically return —
            &ldquo;returns&rdquo; here means withdrawal from a course and removal of your
            access to it.
          </p>
        </Clause>

        <Clause title="2. Full refund — no questions asked">
          <p>You are entitled to a full refund when all of the following are true:</p>
          <ul>
            <li>
              You request it within 7 calendar days of your enrolment being activated.
            </li>
            <li>You have completed 25% or less of the course lessons.</li>
            <li>You have not completed the course.</li>
          </ul>
        </Clause>

        <Clause title="3. Full refund — regardless of time or progress">
          <p>We will refund you in full, whatever your progress, if:</p>
          <ul>
            <li>We cancel a course or fail to deliver the material advertised.</li>
            <li>
              You were charged twice for the same enrolment, or charged in error.
              Duplicate payments are always refunded.
            </li>
            <li>
              A technical fault on our side prevented you from accessing the course and we
              could not resolve it within a reasonable period.
            </li>
            <li>
              We cancel a paid live session and cannot offer a recording or an alternative
              date.
            </li>
          </ul>
        </Clause>

        <Clause title="4. When we cannot refund">
          <ul>
            <li>
              You have completed more than 25% of the course, or completed it entirely,
              and none of the circumstances in section 3 apply.
            </li>
            <li>More than 30 days have passed since enrolment.</li>
            <li>Free courses — nothing was paid, so there is nothing to refund.</li>
            <li>
              Your account was terminated for breaching our{" "}
              <Link href="/terms">terms &amp; conditions</Link>, for example by sharing
              course material or cheating in an assessment.
            </li>
          </ul>
        </Clause>

        <Clause title="5. How to request a refund">
          <p>
            Email <a href={`mailto:${brand.contact.email}`}>{brand.contact.email}</a> from
            the address on your account, including:
          </p>
          <ul>
            <li>Your full name and registered mobile number.</li>
            <li>The course name and your payment reference number.</li>
            <li>The reason for your request.</li>
            <li>The bank account details the refund should be sent to.</li>
          </ul>
          <p>
            We acknowledge every request within <strong>2 working days</strong> and give a
            decision within <strong>7 working days</strong>.
          </p>
        </Clause>

        <Clause title="6. How refunds are paid">
          <ul>
            <li>
              Refunds are issued by bank transfer to an account in the name of the account
              holder, in Sri Lankan Rupees.
            </li>
            <li>
              Once approved, funds are normally sent within{" "}
              <strong>7 working days</strong>, and your bank may take a further few days
              to credit them.
            </li>
            <li>
              We refund the amount you paid us. Any bank charges your own bank applies to
              receive the transfer are yours.
            </li>
            <li>Your access to the course ends when the refund is approved.</li>
          </ul>
        </Clause>

        <Clause title="7. Failed and unmatched payments">
          <p>
            If a bank transfer fails, is rejected, or cannot be matched to an order, no
            enrolment is created and no fee is retained. Every such event is recorded in
            our payment log. If money left your account but no enrolment appeared, contact
            us with your deposit slip and we will trace it.
          </p>
        </Clause>

        <Clause title="8. Disagreements">
          <p>
            If you are unhappy with a refund decision, reply to our email and ask for it
            to be reviewed. We will look at it again and give you a final written
            decision. This policy does not affect any statutory rights you have under Sri
            Lankan consumer law.
          </p>
        </Clause>

        <Clause title="9. Contact">
          <p>
            All refund matters:{" "}
            <a href={`mailto:${brand.contact.email}`}>{brand.contact.email}</a>.
          </p>
        </Clause>
      </LegalBody>
    </>
  );
}
