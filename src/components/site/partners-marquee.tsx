import Image from "next/image";

import { Container, Section, SectionHeading } from "@/components/ui/layout";
import type { Partner } from "@/lib/data/site-content";

export function PartnersMarquee({ partners }: { partners: Partner[] }) {
  if (partners.length === 0) return null;

  return (
    <Section className="bg-cream py-14 sm:py-16 lg:py-20">
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
        className="border-hairline relative mt-10 overflow-hidden border-y"
        role="img"
        aria-label={`Partner and collaborating organisations: ${partners.map((p) => p.name).join(", ")}`}
      >
        <div
          className="animate-marquee flex w-max items-center gap-16 py-8"
          aria-hidden="true"
        >
          {[...partners, ...partners].map((partner, i) => (
            <div
              key={`${partner.id}-${i}`}
              className="relative h-16 w-44 shrink-0 sm:h-20 sm:w-52"
            >
              <Image
                src={partner.logo_url}
                alt=""
                fill
                sizes="208px"
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
