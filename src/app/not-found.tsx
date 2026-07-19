import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

// See src/app/(marketing)/layout.tsx: nonce-based CSP requires dynamic
// rendering, or every script on this page is silently blocked.
export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="bg-wash flex min-h-svh flex-col items-center justify-center px-5 text-center">
      <Link href="/" aria-label="CloudIskole home">
        <Logo />
      </Link>

      <p className="font-display mt-12 text-6xl font-semibold text-teal-600">404</p>
      <h1 className="font-display mt-4 text-2xl font-semibold sm:text-3xl">
        We could not find that page
      </h1>
      <p className="text-ink-muted mt-3 max-w-md text-sm leading-relaxed">
        The link may be out of date, or the page may have moved. Let&rsquo;s get you back
        on track.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Back to home
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/courses">Browse courses</Link>
        </Button>
      </div>
    </div>
  );
}
