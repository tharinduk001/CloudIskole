import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

/**
 * No profile fetch here, deliberately — see the comment in `SiteHeader` for
 * why its auth-aware state is fetched client-side instead of being read from
 * cookies at this layout level.
 *
 * Forced dynamic despite the above: this group was originally meant to
 * generate as static HTML, but nonce-based CSP (src/proxy.ts) cannot be
 * injected into a page prerendered at build time — Next.js's own docs are
 * explicit that a static page has no request/response headers to read the
 * nonce from. Tried the documented SRI-based alternative (build-time
 * integrity hashes instead of a nonce) and reverted it after testing showed
 * it doesn't cover the inline scripts Next uses to stream RSC payloads —
 * see the long comment in proxy.ts's buildCsp for the full story. Left
 * static, every script on these pages was silently blocked in production:
 * the mobile nav menu did nothing, and the contact form never became
 * interactive. Correctness wins over the CDN-caching win here.
 */
export const dynamic = "force-dynamic";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* Lets keyboard and screen-reader users jump past the nav on every page. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-onyx focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="bg-cream text-onyx flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
