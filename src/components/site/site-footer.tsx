import { Mail, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Liyawel } from "@/components/brand/liyawel";
import { Container } from "@/components/ui/layout";
import { brand } from "@/lib/brand";
import { footerNav } from "@/lib/navigation";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-onyx relative mt-auto overflow-hidden">
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/backgrounds/mural-hero.jpg"
          alt=""
          fill
          sizes="100vw"
          quality={50}
          className="object-cover object-center opacity-[0.18]"
        />
        <div className="from-onyx via-onyx/95 to-onyx absolute inset-0 bg-gradient-to-b" />
      </div>
      <Liyawel
        strokeClassName="stroke-white"
        className="pointer-events-none absolute -right-16 -bottom-20 size-80 opacity-[0.08]"
      />

      <Container size="wide" className="relative py-14 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="flex flex-col gap-5">
            <span className="font-display text-[1.35rem] leading-none font-semibold tracking-tight text-white">
              {brand.nameParts.first}
              <span className="text-terracotta-400">{brand.nameParts.second}</span>
            </span>
            <p className="measure text-sm leading-relaxed text-white/70">
              {brand.description}
            </p>
            <div className="flex flex-col gap-2 text-sm text-white/70">
              <a
                href={`mailto:${brand.contact.email}`}
                className="hover:text-terracotta-400 inline-flex w-fit items-center gap-2 rounded"
              >
                <Mail className="size-4" aria-hidden="true" />
                {brand.contact.email}
              </a>
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-4" aria-hidden="true" />
                {brand.country}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footerNav.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h2 className="font-display text-sm font-semibold text-white">
                  {group.title}
                </h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="hover:text-terracotta-400 rounded text-sm text-white/70"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-8 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {brand.legalEntity}. All rights reserved.
          </p>
          <p>Made in Sri Lanka 🇱🇰 for Sri Lankan students.</p>
        </div>
      </Container>
    </footer>
  );
}
