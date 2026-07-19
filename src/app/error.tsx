"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary. Catches render and data-fetch failures below the
 * root layout, so a broken page never becomes a blank screen.
 *
 * The `error.digest` is a server-generated hash of the real error: it lets us
 * find the full stack in the logs without ever putting one in front of a user.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Wire to Sentry in Phase 7.
    console.error("Unhandled route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">
        Something went wrong
      </h1>
      <p className="text-ink-muted mt-3 max-w-md text-sm leading-relaxed">
        This one is on us, not you. Try again — if it keeps happening, let us know and we
        will fix it.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={reset}>
          <RefreshCw aria-hidden="true" />
          Try again
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/contact">Report the problem</Link>
        </Button>
      </div>

      {error.digest ? (
        <p className="text-ink-subtle mt-8 font-mono text-xs">
          Reference: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
