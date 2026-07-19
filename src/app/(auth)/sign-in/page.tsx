import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthPanel } from "@/components/auth/auth-panel";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your CloudIskole account.",
  robots: { index: false, follow: false },
};

// Nonce-based CSP (src/proxy.ts) can only be injected into a page rendered
// per-request — a statically prerendered page has no request/response
// headers to read the nonce from, so every script on it gets silently
// blocked in production. This page's entire content is the AuthPanel client
// component, so it must render dynamically to be usable at all.
export const dynamic = "force-dynamic";

export default function SignInPage() {
  // AuthPanel reads search params, so it must sit inside Suspense.
  return (
    <Suspense fallback={<div className="h-96" />}>
      <AuthPanel mode="sign-in" />
    </Suspense>
  );
}
