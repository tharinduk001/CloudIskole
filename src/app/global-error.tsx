"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Last-resort boundary for failures in the root layout itself.
 *
 * This replaces the entire document, so it must render its own <html> and
 * <body> — and it cannot rely on the app's CSS or fonts having loaded, which
 * is why the styles here are inline rather than Tailwind classes.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error:", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en-LK">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          backgroundColor: "#fcfcfa",
          color: "#171717",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <p style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0e5c57", margin: 0 }}>
          CloudIskole
        </p>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
          The site hit an unexpected error
        </h1>
        <p style={{ color: "#5c5c57", maxWidth: "28rem", margin: 0, lineHeight: 1.6 }}>
          Please try reloading. If the problem continues, email hello@cloudiskole.lk and
          quote the reference below.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            padding: "0.7rem 1.5rem",
            borderRadius: "9999px",
            border: "none",
            backgroundColor: "#0e5c57",
            color: "#ffffff",
            fontSize: "0.9rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
        {error.digest ? (
          <p style={{ color: "#8a8a83", fontSize: "0.75rem", marginTop: "1rem" }}>
            Reference: {error.digest}
          </p>
        ) : null}
      </body>
    </html>
  );
}
