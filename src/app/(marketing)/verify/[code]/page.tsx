import { CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { getCertificateByCode } from "@/lib/data/gamification";

export const metadata: Metadata = {
  title: "Verify a certificate",
  description: "Verify the authenticity of a CloudIskole course completion certificate.",
};

const dateFormatter = new Intl.DateTimeFormat("en-LK", {
  timeZone: "Asia/Colombo",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cert = await getCertificateByCode(code.toUpperCase());
  // `holder_name` comes straight from `profiles.full_name`, which is
  // `not null default ''` — a student who never set one has an empty
  // string, not null, so this needs `||` rather than relying on the view.
  const holderName = cert?.holder_name || "CloudIskole student";

  return (
    <Section className="py-16 sm:py-24">
      <Container size="narrow" className="max-w-xl">
        <h1 className="font-display text-2xl font-semibold">Certificate verification</h1>
        <p className="text-ink-muted mt-2 text-sm">Code: {code.toUpperCase()}</p>

        <Card className="mt-6 p-8">
          {!cert ? (
            <div className="flex items-start gap-3">
              <XCircle className="text-danger mt-0.5 size-6 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-ink font-semibold">No certificate found</p>
                <p className="text-ink-muted mt-1 text-sm">
                  This code does not match any certificate on record. Double-check it against the
                  certificate itself.
                </p>
              </div>
            </div>
          ) : !cert.is_valid ? (
            <div className="flex items-start gap-3">
              <XCircle className="text-danger mt-0.5 size-6 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-ink font-semibold">This certificate has been revoked</p>
                <p className="text-ink-muted mt-1 text-sm">
                  It was issued to {holderName} for {cert.course_title}, but is no longer valid.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-success mt-0.5 size-6 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-ink font-semibold">Valid certificate</p>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-ink-subtle">Holder</dt>
                  <dd className="text-ink font-medium">{holderName}</dd>
                  <dt className="text-ink-subtle">Course</dt>
                  <dd className="text-ink font-medium">{cert.course_title}</dd>
                  <dt className="text-ink-subtle">Issued</dt>
                  <dd className="text-ink font-medium">
                    {cert.issued_at ? dateFormatter.format(new Date(cert.issued_at)) : "—"}
                  </dd>
                </dl>
              </div>
            </div>
          )}
        </Card>
      </Container>
    </Section>
  );
}
