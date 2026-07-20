import Image from "next/image";

import { Liyawel } from "@/components/brand/liyawel";
import { Container } from "@/components/ui/layout";

/** Shared hero band for interior pages, so they share one rhythm. */
export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="bg-mural-wash border-hairline relative overflow-hidden border-b">
      <div
        className="absolute inset-y-0 right-0 hidden w-1/2 md:block"
        aria-hidden="true"
      >
        <Image
          src="/backgrounds/mural-hero.jpg"
          alt=""
          fill
          sizes="50vw"
          quality={50}
          className="object-cover object-[85%_30%] opacity-[0.32]"
        />
        <div className="from-mural-wash to-mural-wash/0 absolute inset-0 bg-gradient-to-r" />
      </div>
      <Liyawel
        strokeClassName="stroke-terracotta-600"
        className="absolute -top-20 -right-24 size-96 opacity-[0.06]"
      />
      <Container size="wide" className="relative z-10 py-16 sm:py-20">
        <div className="max-w-3xl">
          {eyebrow ? (
            <span className="text-terracotta-600 text-xs font-semibold tracking-[0.14em] uppercase">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="font-display text-onyx mt-3 text-4xl leading-[1.05] tracking-tight sm:text-6xl">
            {title}
          </h1>
          {description ? (
            <p className="text-mist mt-5 text-lg leading-relaxed">{description}</p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
