import { NextResponse } from "next/server";

import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth return point. Google sends the student back here with a one-time
 * `code`, which we exchange for a session cookie.
 *
 * This route must be listed in the Supabase dashboard under
 * Authentication → URL Configuration → Redirect URLs, for every environment.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error_description");

  // In production the canonical origin comes from config, not the request —
  // a forged Host header must not be able to bounce the session elsewhere.
  const origin =
    process.env.NODE_ENV === "production" ? clientEnv.NEXT_PUBLIC_SITE_URL : url.origin;

  // Same-site paths only.
  const rawNext = url.searchParams.get("next");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/dashboard";

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent("Google sign-in was cancelled or refused.")}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent("That sign-in link was incomplete. Please try again.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent("We could not complete sign-in. The link may have already been used.")}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
