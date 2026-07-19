import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthPanel } from "@/components/auth/auth-panel";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your CloudIskole account.",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  // AuthPanel reads search params, so it must sit inside Suspense.
  return (
    <Suspense fallback={<div className="h-96" />}>
      <AuthPanel mode="sign-in" />
    </Suspense>
  );
}
