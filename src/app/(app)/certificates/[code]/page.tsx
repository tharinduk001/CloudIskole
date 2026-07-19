import type { Metadata } from "next";

import { Liyawel } from "@/components/brand/liyawel";
import { Logo } from "@/components/brand/logo";
import { PrintButton } from "@/components/certificates/print-button";
import { Container, Section } from "@/components/ui/layout";
import { getCertificateForViewer, getCertificateHolderName } from "@/lib/data/gamification";

export const metadata: Metadata = { title: "Your certificate", robots: { index: false, follow: false } };

const dateFormatter = new Intl.DateTimeFormat("en-LK", {
  timeZone: "Asia/Colombo",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cert = await getCertificateForViewer(code.toUpperCase());
  const holderName = await getCertificateHolderName(cert.user_id);

  return (
    <Section className="py-10 print:py-0">
      <Container size="narrow" className="max-w-3xl">
        <div className="flex items-center justify-between print:hidden">
          <h1 className="font-display text-2xl font-semibold">Your certificate</h1>
          <PrintButton />
        </div>

        {cert.revoked_at ? (
          <p className="border-danger/20 bg-danger-soft text-danger mt-6 rounded-xl border px-4 py-3 text-sm print:hidden">
            This certificate was revoked{cert.revoke_reason ? `: ${cert.revoke_reason}` : "."}
          </p>
        ) : null}

        <div className="border-line bg-surface relative mt-6 overflow-hidden rounded-2xl border-2 p-10 shadow-sm sm:p-16 print:mt-0 print:rounded-none print:border-4 print:shadow-none">
          <Liyawel className="absolute -top-16 -right-16 size-72 opacity-[0.06]" />
          <Liyawel className="absolute -bottom-16 -left-16 size-72 rotate-180 opacity-[0.06]" />

          <div className="relative flex flex-col items-center text-center">
            <Logo />
            <p className="text-gold-700 mt-8 text-xs font-semibold tracking-[0.2em] uppercase">
              Certificate of completion
            </p>
            <p className="text-ink-muted mt-6 text-base">This certifies that</p>
            <p className="font-display mt-2 text-3xl font-semibold sm:text-4xl">{holderName}</p>
            <p className="text-ink-muted mt-6 text-base">has successfully completed</p>
            <p className="font-display mt-2 text-2xl font-semibold sm:text-3xl">{cert.course.title}</p>

            <p className="text-ink-subtle mt-10 text-sm">
              Issued {dateFormatter.format(new Date(cert.issued_at))}
            </p>
            <p className="text-ink-subtle mt-1 font-mono text-xs">
              Certificate {cert.code} · verify at cloudiskole.lk/verify/{cert.code}
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
