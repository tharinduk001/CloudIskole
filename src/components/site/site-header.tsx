"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { brand } from "@/lib/brand";
import { mainNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  /**
   * The mobile menu stores the path it was opened on rather than a boolean.
   * Navigating changes `pathname`, so the menu closes itself — no effect
   * syncing state to a route change, and no cascading render.
   */
  const [openedOnPath, setOpenedOnPath] = React.useState<string | null>(null);
  const open = openedOnPath === pathname;

  const [scrolled, setScrolled] = React.useState(false);

  // The header is transparent over the hero and gains a border + blur once
  // the user scrolls, so it never floats ambiguously over content.
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Prevent the page behind the mobile menu from scrolling.
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape closes the menu — expected of any overlay.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenedOnPath(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-[var(--duration-base)]",
        scrolled || open
          ? "border-line bg-paper/85 border-b backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <Container size="wide">
        <div className="flex h-18 items-center justify-between gap-4">
          <Link href="/" className="rounded-lg" aria-label={`${brand.name} home`}>
            <Logo />
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-[var(--duration-fast)]",
                      isActive(item.href)
                        ? "bg-teal-50 text-teal-700"
                        : "text-ink-muted hover:bg-teal-50/60 hover:text-teal-700",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpenedOnPath(open ? null : pathname)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="text-ink -mr-2 grid size-11 place-items-center rounded-xl hover:bg-teal-50 lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      {open ? (
        <div
          id="mobile-menu"
          className="border-line bg-paper fixed inset-x-0 top-18 bottom-0 z-50 overflow-y-auto border-t lg:hidden"
        >
          <Container className="py-6">
            <nav aria-label="Mobile">
              <ul className="flex flex-col gap-1">
                {mainNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={cn(
                        "block rounded-xl px-4 py-3.5 text-base font-medium",
                        isActive(item.href)
                          ? "bg-teal-50 text-teal-700"
                          : "text-ink hover:bg-teal-50/60",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-6 flex flex-col gap-3">
              <Button asChild size="lg">
                <Link href="/sign-up">Get started free</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
