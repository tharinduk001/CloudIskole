"use client";

import { ArrowLeft, ArrowRight, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { sendEmailOtp, verifyEmailOtp } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";

/** Google's mark. Inlined so the CSP never has to allow a remote image host. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.55Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.1 0 5.7-1.03 7.62-2.8l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.55-2.03-6.46-4.76H1.69v2.98A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.54 14.65a7.2 7.2 0 0 1 0-4.6V7.07H1.69a12 12 0 0 0 0 10.56l3.85-2.98Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.69 0 3.2.58 4.4 1.72l3.3-3.3C17.7 1.2 15.1 0 12 0 7.4 0 3.43 2.65 1.69 6.51l3.85 2.98C6.45 6.78 9 4.75 12 4.75Z"
      />
    </svg>
  );
}

export function AuthPanel({ mode }: { mode: "sign-in" | "sign-up" }) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const urlError = searchParams.get("error");

  const [email, setEmail] = React.useState("");
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [googleError, setGoogleError] = React.useState<string | null>(null);

  const [sendState, sendAction, sending] = useActionState(sendEmailOtp, idleResult);
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyEmailOtp,
    idleResult,
  );

  /**
   * Which step to show is DERIVED from whether the code was actually sent,
   * rather than mirrored into state by an effect — an effect here would cause
   * a cascading second render on every submit.
   *
   * "Use a different email" records the result it is dismissing. Because
   * `useActionState` returns a fresh object per submission, a later resend
   * produces a different identity and advances the form again.
   */
  const [dismissed, setDismissed] = React.useState<typeof sendState | null>(null);
  const stage: "email" | "code" =
    sendState.status === "success" && sendState !== dismissed ? "code" : "email";

  async function signInWithGoogle() {
    setGoogleError(null);
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setGoogleError("Could not reach Google. Check your connection and try again.");
        setGoogleLoading(false);
      }
      // On success the browser navigates away; leave the spinner running.
    } catch {
      setGoogleError("Could not reach Google. Check your connection and try again.");
      setGoogleLoading(false);
    }
  }

  const isSignUp = mode === "sign-up";
  const topError =
    urlError ??
    googleError ??
    (sendState.status === "error" ? sendState.message : null) ??
    (verifyState.status === "error" ? verifyState.message : null);

  return (
    <Card className="p-7 shadow-sm sm:p-8">
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold">
          {stage === "code"
            ? "Check your email"
            : isSignUp
              ? "Create your free account"
              : "Welcome back"}
        </h1>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          {stage === "code"
            ? `We sent a 6-digit code to ${email}.`
            : isSignUp
              ? "Start learning Cloud and DevOps today. No card needed."
              : "Sign in to pick up where you left off."}
        </p>
      </div>

      {topError ? (
        <p
          role="alert"
          className="border-danger/20 bg-danger-soft text-danger mt-6 rounded-xl border px-4 py-3 text-sm"
        >
          {topError}
        </p>
      ) : null}

      {stage === "email" ? (
        <>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="mt-6 w-full"
            onClick={signInWithGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-4">
            <span className="bg-line h-px flex-1" />
            <span className="text-ink-subtle text-xs">or use email</span>
            <span className="bg-line h-px flex-1" />
          </div>

          <form action={sendAction} className="flex flex-col gap-4">
            <input type="hidden" name="next" value={next} />
            <Field
              label="Email address"
              required
              error={
                sendState.status === "error" ? sendState.fieldErrors?.email : undefined
              }
              hint="We'll email you a 6-digit code — no password to remember."
            >
              {(props) => (
                <Input
                  {...props}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </Field>

            <Button type="submit" size="lg" disabled={sending}>
              {sending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Mail aria-hidden="true" />
              )}
              Email me a code
            </Button>
          </form>
        </>
      ) : (
        <form action={verifyAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={next} />

          <Field
            label="6-digit code"
            required
            error={
              verifyState.status === "error" ? verifyState.fieldErrors?.token : undefined
            }
          >
            {(props) => (
              <Input
                {...props}
                name="token"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                placeholder="000000"
                required
                autoFocus
                className="text-center font-mono text-2xl tracking-[0.5em]"
              />
            )}
          </Field>

          <Button type="submit" size="lg" disabled={verifying}>
            {verifying ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight aria-hidden="true" />
            )}
            Verify and continue
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(sendState)}
          >
            <ArrowLeft aria-hidden="true" />
            Use a different email
          </Button>
        </form>
      )}

      <p className="text-ink-muted mt-7 text-center text-sm">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-teal-600 hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to CloudIskole?{" "}
            <Link href="/sign-up" className="font-medium text-teal-600 hover:underline">
              Create a free account
            </Link>
          </>
        )}
      </p>

      {isSignUp ? (
        <p className="text-ink-subtle mt-5 text-center text-xs leading-relaxed">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="underline hover:text-teal-700">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-teal-700">
            privacy policy
          </Link>
          .
        </p>
      ) : null}
    </Card>
  );
}
