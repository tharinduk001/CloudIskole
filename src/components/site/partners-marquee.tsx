import Image from "next/image";

import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { partners } from "@/content/home";

/**
 * The section itself stays on the site's cream/surface palette; only the
 * individual logo chips go dark. Several partner logos (notably the AWS
 * Community Builders mark) are supplied as light-on-transparent art meant
 * for a dark background and would wash out directly on a cream surface.
 */
export function PartnersMarquee() {
  return (
    <Section className="bg-cream">
      <Container size="wide">
        <SectionHeading
          size="xl"
          eyebrow="Strengthened by collaboration"
          title="Academic & community partners"
          eyebrowClassName="text-terracotta-600"
          titleClassName="text-onyx"
        />
      </Container>

      <div
        className="border-hairline relative mt-14 overflow-hidden border-y"
        role="img"
        aria-label={`Partner and collaborating organisations: ${partners.map((p) => p.name).join(", ")}`}
      >
        <div
          className="animate-marquee flex w-max items-center gap-4 py-6"
          aria-hidden="true"
        >
          {[...partners, ...partners].map((partner, i) => (
            <div
              key={`${partner.name}-${i}`}
              className="bg-onyx flex h-20 w-48 shrink-0 items-center justify-center px-6"
            >
              <div className="relative h-10 w-32">
                <Image
                  src={partner.logoUrl}
                  alt=""
                  fill
                  sizes="140px"
                  className="object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
