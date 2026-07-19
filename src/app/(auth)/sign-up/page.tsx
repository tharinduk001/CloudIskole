import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthPanel } from "@/components/auth/auth-panel";

export const metadata: Metadata = {
  title: "Create your free account",
  description:
    "Join CloudIskole free and start learning Cloud, DevOps and Software Engineering.",
  robots: { index: false, follow: false },
};

// See src/app/(auth)/sign-in/page.tsx for why this must be dynamic: a
// nonce-based CSP can't be applied to a statically prerendered page.
export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <AuthPanel mode="sign-up" />
    </Suspense>
  );
}
