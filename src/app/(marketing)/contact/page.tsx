import { Clock, Mail, MessageCircleQuestion } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { siWhatsapp } from "simple-icons";

import { ContactForm } from "@/components/site/contact-form";
import { PageHeader } from "@/components/site/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { brand } from "@/lib/brand";

/** "+94000000000" -> "+94 00 000 0000" — grouped for readability, not parsed. */
function formatPhoneDisplay(e164: string): string {
  const digits = e164.replace(/[^\d]/g, "");
  const country = digits.slice(0, digits.length - 9);
  const rest = digits.slice(-9);
  return `+${country} ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
}

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
              <h2 className="font-display text-onyx text-xl font-semibold">
                Send a message
              </h2>
              <p className="text-mist mt-2 text-sm leading-relaxed">
                Fields marked with an asterisk are required.
              </p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>

            <aside className="flex flex-col gap-4">
              <Card className="border-terracotta-400/50 rounded-none border-2 p-6">
                <span
                  className="grid size-10 place-items-center rounded-none bg-[#25D366]/10 text-[#25D366]"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" role="img" className="size-5 fill-current">
                    <path d={siWhatsapp.path} />
                  </svg>
                </span>
                <h3 className="font-display text-onyx mt-4 text-base font-semibold">
                  Chat on WhatsApp
                </h3>
                <p className="text-mist mt-2 text-sm leading-relaxed">
                  The fastest way to reach us. Message us directly at{" "}
                  <span className="text-onyx font-medium">
                    {formatPhoneDisplay(brand.contact.whatsapp)}
                  </span>
                  .
                </p>
                <Button
                  asChild
                  size="sm"
                  className="mt-4 w-full rounded-none bg-[#25D366] text-white hover:bg-[#1ebe5a] active:bg-[#1aa653]"
                >
                  <a
                    href={`https://wa.me/${brand.contact.whatsapp.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg viewBox="0 0 24 24" role="img" className="size-4 fill-current">
                      <path d={siWhatsapp.path} />
                    </svg>
                    Message us on WhatsApp
                  </a>
                </Button>
              </Card>

              <Card className="border-hairline rounded-none p-6">
                <span className="bg-terracotta-50 text-terracotta-600 grid size-10 place-items-center rounded-none">
                  <Mail className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display text-onyx mt-4 text-base font-semibold">
                  Email us
                </h3>
                <p className="text-mist mt-2 text-sm leading-relaxed">
                  Prefer email? Write to us directly at{" "}
                  <a
                    href={`mailto:${brand.contact.email}`}
                    className="text-terracotta-600 font-medium hover:underline"
                  >
                    {brand.contact.email}
                  </a>
                  .
                </p>
              </Card>

              <Card className="border-hairline rounded-none p-6">
                <span className="bg-terracotta-50 text-terracotta-600 grid size-10 place-items-center rounded-none">
                  <Clock className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display text-onyx mt-4 text-base font-semibold">
                  Response time
                </h3>
                <p className="text-mist mt-2 text-sm leading-relaxed">
                  We reply within 2 working days. Payment and enrollment questions are
                  handled first.
                </p>
              </Card>

              <Card className="border-hairline rounded-none p-6">
                <span className="border-terracotta-400/40 bg-terracotta-50 text-terracotta-600 grid size-10 place-items-center rounded-none border">
                  <MessageCircleQuestion className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display text-onyx mt-4 text-base font-semibold">
                  Common questions
                </h3>
                <p className="text-mist mt-2 text-sm leading-relaxed">
                  Many answers are already on the{" "}
                  <Link
                    href="/#faq"
                    className="text-terracotta-600 font-medium hover:underline"
                  >
                    home page FAQ
                  </Link>
                  , and refund questions are covered in our{" "}
                  <Link
                    href="/refunds"
                    className="text-terracotta-600 font-medium hover:underline"
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
