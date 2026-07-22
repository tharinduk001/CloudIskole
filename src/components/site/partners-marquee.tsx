import Image from "next/image";

import { partners } from "@/content/home";

/**
 * Rendered as a dark band deliberately: several partner logos (notably the
 * AWS Community Builders mark) are supplied as light-on-transparent art
 * meant for a dark background, and would wash out on the marketing pages'
 * cream surfaces.
 */
export function PartnersMarquee() {
  return (
    <section className="bg-onyx relative overflow-hidden py-14">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <span className="text-xs font-semibold tracking-[0.14em] text-white/50 uppercase">
          Strengthened by collaboration
        </span>
        <h2 className="font-display mt-3 text-2xl font-semibold text-white sm:text-3xl">
          Academic &amp; community partners
        </h2>
      </div>

      <div
        className="relative mt-10 overflow-hidden border-y border-white/10 py-6"
        role="img"
        aria-label={`Partner and collaborating organisations: ${partners.map((p) => p.name).join(", ")}`}
      >
        <div className="animate-marquee flex w-max items-center gap-4" aria-hidden="true">
          {[...partners, ...partners].map((partner, i) => (
            <div
              key={`${partner.name}-${i}`}
              className="flex h-20 w-48 shrink-0 items-center justify-center border border-white/10 bg-white/5 px-6"
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
    </section>
  );
}
