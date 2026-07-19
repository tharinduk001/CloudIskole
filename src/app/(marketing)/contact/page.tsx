import { Clock, Mail, MessageCircleQuestion } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/site/contact-form";
import { PageHeader } from "@/components/site/page-header";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Get in touch with ${brand.name} about courses, enrollment, payments or partnerships.`,
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to us"
        description="Questions about a course, a payment, or where to start? Send us a message and a real person will reply."
      />

      <Section>
        <Container size="wide">
          <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <h2 className="font-display text-xl font-semibold">Send a message</h2>
              <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                Fields marked with an asterisk are required.
              </p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>

            <aside className="flex flex-col gap-4">
              <Card className="p-6">
                <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-600">
                  <Mail className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display mt-4 text-base font-semibold">Email us</h3>
                <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                  Prefer email? Write to us directly at{" "}
                  <a
                    href={`mailto:${brand.contact.email}`}
                    className="font-medium text-teal-600 hover:underline"
                  >
                    {brand.contact.email}
                  </a>
                  .
                </p>
              </Card>

              <Card className="p-6">
                <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-600">
                  <Clock className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display mt-4 text-base font-semibold">
                  Response time
                </h3>
                <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                  We reply within 2 working days. Payment and enrollment questions are
                  handled first.
                </p>
              </Card>

              <Card className="p-6">
                <span className="border-gold-200 bg-gold-50 text-gold-700 grid size-10 place-items-center rounded-xl border">
                  <MessageCircleQuestion className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display mt-4 text-base font-semibold">
                  Common questions
                </h3>
                <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                  Many answers are already on the{" "}
                  <Link
                    href="/#tracks"
                    className="font-medium text-teal-600 hover:underline"
                  >
                    home page FAQ
                  </Link>
                  , and refund questions are covered in our{" "}
                  <Link
                    href="/refunds"
                    className="font-medium text-teal-600 hover:underline"
                  >
                    refunds policy
                  </Link>
                  .
                </p>
              </Card>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
