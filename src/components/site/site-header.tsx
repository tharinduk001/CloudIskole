"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Logo } from "@/components/brand/logo";
import { UserMenu, type HeaderProfile } from "@/components/site/user-menu";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { brand } from "@/lib/brand";
import { mainNav } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();

  /**
   * Auth state is fetched client-side, deliberately, rather than as a prop
   * from a Server Component layout. This route group holds the public,
   * content-only pages (home, about, legal, the course catalogue) that
   * should serve as static HTML from the CDN; a layout that calls
   * `cookies()` to look up the signed-in user forces every page beneath it
   * into per-request dynamic rendering — Next.js cannot statically render
   * part of a tree and dynamically render the rest without opting the whole
   * app into Partial Prerendering. Pages that already need per-user data
   * (a course's enrollment state, the dashboard) fetch it themselves; this
   * header does not need to hold up everything else's static generation to
   * show an avatar.
   *
   * Trade-off accepted: a signed-in visitor may see the signed-out "Sign in"
   * button for one client render before this swaps in, rather than the
   * layout blocking on a cookie read before sending any HTML.
   */
  const [profile, setProfile] = React.useState<HeaderProfile | null>(null);

  React.useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setProfile(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, role")
        .eq("id", user.id)
        .single();

      if (!cancelled) setProfile(data);
    }

    void loadProfile();

    // Keeps the header in sync across sign-in, sign-out and token refresh —
    // including the moment a magic-link/OTP redirect lands back on a
    // marketing page after auth completes elsewhere.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadProfile();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

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
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-[var(--duration-base)]",
          scrolled || open
            ? "border-hairline bg-cream/90 border-b backdrop-blur-md"
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
                        "rounded-none px-4 py-2 text-sm font-medium transition-colors duration-[var(--duration-fast)]",
                        isActive(item.href)
                          ? "bg-terracotta-50 text-terracotta-600"
                          : "text-onyx-soft hover:bg-terracotta-50/60 hover:text-terracotta-600",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="hidden items-center gap-2 lg:flex">
              {profile ? (
                <UserMenu profile={profile} />
              ) : (
                <Button
                  asChild
                  size="sm"
                  className="bg-terracotta-600 hover:bg-terracotta-700 active:bg-terracotta-700 rounded-none"
                >
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOpenedOnPath(open ? null : pathname)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="text-onyx hover:bg-terracotta-50 -mr-2 grid size-11 place-items-center lg:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </Container>
      </header>

      {/*
       * Deliberately a sibling of <header>, not nested inside it: the header
       * gets `backdrop-blur-md` while this is open (see className above),
       * and `backdrop-filter` on an ancestor creates a new containing block
       * for `position: fixed` descendants. Nested inside <header>, this
       * panel's `top-18 bottom-0` resolved against the header's own ~72px
       * box instead of the viewport and collapsed to under 1px tall —
       * present in the DOM, doing nothing visible, which is exactly why
       * tapping the hamburger looked like it did nothing at all.
       */}
      {open ? (
        <div
          id="mobile-menu"
          className="border-hairline bg-cream fixed inset-x-0 top-18 bottom-0 z-50 overflow-y-auto border-t lg:hidden"
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
                        "block rounded-none px-4 py-3.5 text-base font-medium",
                        isActive(item.href)
                          ? "bg-terracotta-50 text-terracotta-600"
                          : "text-onyx hover:bg-terracotta-50/60",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-6 flex flex-col gap-3">
              {profile ? (
                <Button
                  asChild
                  size="lg"
                  className="bg-terracotta-600 hover:bg-terracotta-700 rounded-none"
                >
                  <Link href="/dashboard">Go to dashboard</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="bg-terracotta-600 hover:bg-terracotta-700 rounded-none"
                >
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              )}
            </div>
          </Container>
        </div>
      ) : null}
    </>
  );
}
