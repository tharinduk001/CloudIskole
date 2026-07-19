import { Mail, MapPin } from "lucide-react";
import Link from "next/link";

import { Liyawel } from "@/components/brand/liyawel";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/layout";
import { brand } from "@/lib/brand";
import { footerNav } from "@/lib/navigation";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-line bg-surface relative mt-auto overflow-hidden border-t">
      <Liyawel className="pointer-events-none absolute -right-16 -bottom-20 size-80 opacity-[0.045]" />

      <Container size="wide" className="relative py-14 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="flex flex-col gap-5">
            <Logo />
            <p className="text-ink-muted measure text-sm leading-relaxed">
              {brand.description}
            </p>
            <div className="text-ink-muted flex flex-col gap-2 text-sm">
              <a
                href={`mailto:${brand.contact.email}`}
                className="inline-flex w-fit items-center gap-2 rounded hover:text-teal-700"
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
                <h2 className="font-display text-ink text-sm font-semibold">
                  {group.title}
                </h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-ink-muted rounded text-sm hover:text-teal-700"
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

        <div className="border-line text-ink-subtle mt-12 flex flex-col gap-3 border-t pt-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {brand.legalEntity}. All rights reserved.
          </p>
          <p>Made in Sri Lanka 🇱🇰 for Sri Lankan students.</p>
        </div>
      </Container>
    </footer>
  );
}
