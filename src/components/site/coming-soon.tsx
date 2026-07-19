import { ArrowRight, Construction } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/layout";

/**
 * Placeholder for routes that exist in the navigation but whose feature ships
 * in a later phase. Better than a 404: the link works, and it says plainly
 * what is coming rather than pretending the feature is there.
 */
export function ComingSoon({ feature, detail }: { feature: string; detail: string }) {
  return (
    <Section>
      <Container size="narrow">
        <div className="border-line bg-surface flex flex-col items-center rounded-3xl border px-6 py-16 text-center">
          <span className="border-gold-200 bg-gold-50 text-gold-700 grid size-14 place-items-center rounded-2xl border">
            <Construction className="size-6" aria-hidden="true" />
          </span>
          <h2 className="font-display mt-6 text-2xl font-semibold">
            {feature} is on the way
          </h2>
          <p className="text-ink-muted measure mt-3 text-sm leading-relaxed">{detail}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/sign-up">
                Get notified
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
