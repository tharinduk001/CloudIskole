import { Info } from "lucide-react";
import * as React from "react";

import { Container, Section } from "@/components/ui/layout";
import { cn } from "@/lib/utils";

/**
 * Prose wrapper for the legal pages. Typography rules live here rather than
 * in each document so Privacy, Terms and Refunds stay visually identical.
 */
export function LegalBody({
  lastUpdated,
  children,
}: {
  /** ISO date, e.g. "2026-07-19". Rendered in Sri Lankan format. */
  lastUpdated: string;
  children: React.ReactNode;
}) {
  const formatted = new Date(lastUpdated).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Section className="bg-cream">
      <Container size="narrow">
        <p className="text-mist-soft text-sm">Last updated: {formatted}</p>

        <div
          className={cn(
            "mt-10 flex flex-col gap-8",
            "[&_h2]:font-display [&_h2]:text-onyx [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold",
            "[&_h3]:font-display [&_h3]:text-onyx [&_h3]:text-base [&_h3]:font-semibold",
            "[&_p]:text-mist [&_p]:text-[0.95rem] [&_p]:leading-relaxed",
            "[&_li]:text-mist [&_li]:text-[0.95rem] [&_li]:leading-relaxed",
            "[&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5",
            "[&_a]:text-terracotta-600 [&_a]:font-medium hover:[&_a]:underline",
          )}
        >
          {children}
        </div>
      </Container>
    </Section>
  );
}

/** One numbered clause of a legal document. */
export function Clause({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

/**
 * Flags that a document is a good-faith draft rather than lawyer-reviewed
 * text. Shown to the site owner and users alike — it is more honest than
 * presenting untested boilerplate as settled legal protection.
 */
export function DraftNotice() {
  return (
    <aside className="border-info/20 bg-info-soft flex gap-3 rounded-none border p-5">
      <Info className="text-info mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <p className="text-mist text-sm leading-relaxed">
        <strong className="text-onyx font-medium">Note for review:</strong> this document
        is a working draft written for a Sri Lankan online education service. It should be
        reviewed by a qualified attorney before launch, particularly the sections covering
        payments, refunds and personal data.
      </p>
    </aside>
  );
}
