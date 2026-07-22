import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before every page request. Two jobs:
 *
 *   1. Refresh the Supabase session so a signed-in student is not silently
 *      logged out when their access token expires mid-visit.
 *   2. Issue a per-request nonce and the Content-Security-Policy header.
 *
 * Note the deliberate limit on job 3 that is NOT here: this file performs only
 * *optimistic* redirects. Next.js documents proxy as unsuitable for
 * authorisation, and it is — the real check lives in the data layer and in
 * row-level security. If this file were bypassed entirely, no private data
 * would be exposed; the user would simply see a page shell they cannot fill.
 *
 * Renamed from `middleware.ts` in Next.js 16. Runs on the Node.js runtime.
 */

/** Paths that require a signed-in user. */
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/my"];

/** Paths a signed-in user has no reason to see. */
const AUTH_ONLY_PREFIXES = ["/sign-in", "/sign-up"];

function buildCsp(nonce: string, supabaseUrl: string, isDev: boolean): string {
  // Supabase Realtime uses a websocket on the same host.
  const supabaseWs = supabaseUrl.replace(/^https?:/, "wss:");

  return [
    `default-src 'self'`,
    // 'strict-dynamic' lets Next's nonce'd bootstrap load its own chunks
    // without us having to enumerate them.
    //
    // Tried dropping this to let statically-generated pages skip the nonce
    // requirement (verifying via next.config.ts's experimental.sri hashes
    // instead) — reverted. Even with SRI correctly matching, hydration still
    // failed on every static page: React Server Components stream their
    // payload via *inline* <script> tags on every page, which SRI's external-
    // file hashing does not cover, and a static page has no nonce to give
    // them either. They got silently blocked (no console error — a CSP
    // violation on an inline script is logged differently than a network
    // failure), so hydration never received its data. Proven by testing, not
    // assumed: verified the click handler on the mobile nav button was
    // permanently dead on every static page, in isolation, with SRI on and
    // off. This is a genuine limitation of nonce-based CSP + streaming RSC
    // in this Next.js/Turbopack version, not something the SRI docs page
    // actually solves for inline payload scripts.
    //
    // 'unsafe-eval' is dev-only: React uses eval to rebuild server stack
    // traces for the error overlay.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    // Radix and other primitives set inline `style` attributes to drive
    // animations. Style *attributes* cannot execute script, so allowing them
    // is materially safer than allowing inline <style> blocks.
    `style-src-attr 'unsafe-inline'`,
    // Certification badge artwork is deliberately not locked to one host -
    // admins paste in whatever URL Credly, CertDirectory, or a future issuer
    // gives them - so this allows any HTTPS image rather than an allowlist.
    // Low risk: img-src cannot execute script, and only an admin can write
    // the URLs that end up here (RLS-gated).
    `img-src 'self' blob: data: https:`,
    `font-src 'self'`,
    `connect-src 'self' ${supabaseUrl} ${supabaseWs}${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
    // Course videos are unlisted YouTube embeds, served from the
    // no-cookie domain so viewing a lesson does not set tracking cookies.
    `frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    // Nobody may frame us — defeats clickjacking of the payment approval UI.
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const isDev = process.env.NODE_ENV === "development";

  const nonce = crypto.randomUUID().replaceAll("-", "");
  const csp = buildCsp(nonce, supabaseUrl, isDev);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js reads the nonce back out of this header to stamp its own scripts.
  requestHeaders.set("Content-Security-Policy", csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request: { headers: requestHeaders } });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Must be getUser(), not getSession(): this call is what actually validates
  // and refreshes the token. Removing it silently breaks session persistence.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    // Send them back where they were headed once signed in.
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image optimisation. Running the
     * session refresh on every .svg request would be pure waste.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
