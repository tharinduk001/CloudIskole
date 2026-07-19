"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import * as React from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { requestPhoneOtp, verifyPhoneOtp } from "@/lib/profile/phone-actions";

/**
 * Collects and verifies a phone number via a single SMS OTP.
 *
 * Gates the bank-transfer flow: a paid enrolment is the one place a phone
 * number actually matters (payment support, session reminders), so this is
 * where the one-SMS verification from the build plan happens, rather than
 * forcing it at signup.
 */
export function PhoneVerifyCard({ currentPhone }: { currentPhone: string | null }) {
  const [requestState, requestAction, requesting] = useActionState(requestPhoneOtp, idleResult);
  const [verifyState, verifyAction, verifying] = useActionState(verifyPhoneOtp, idleResult);
  const [codeSent, setCodeSent] = React.useState(false);

  if (verifyState.status === "success") {
    return (
      <div className="border-line bg-surface flex items-center gap-3 rounded-2xl border p-5">
        <ShieldCheck className="size-5 shrink-0 text-teal-600" aria-hidden="true" />
        <p className="text-ink text-sm font-medium">Phone number verified.</p>
      </div>
    );
  }

  return (
    <div className="border-line bg-surface rounded-2xl border p-5">
      <h3 className="text-ink text-sm font-semibold">Verify your phone number</h3>
      <p className="text-ink-muted mt-1 text-xs leading-relaxed">
        We send one SMS code to confirm we can reach you about this payment.
      </p>

      {!codeSent || requestState.status === "error" ? (
        <form
          action={requestAction}
          onSubmit={() => setCodeSent(true)}
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <Field label="Phone number" hint="+94XXXXXXXXX" className="flex-1">
            {(props) => (
              <Input
                {...props}
                name="phone"
                type="tel"
                required
                defaultValue={currentPhone ?? "+94"}
                placeholder="+94771234567"
              />
            )}
          </Field>
          <Button type="submit" disabled={requesting} className="sm:w-auto">
            {requesting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            Send code
          </Button>
        </form>
      ) : (
        <form action={verifyAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="6-digit code" className="flex-1">
            {(props) => (
              <Input
                {...props}
                name="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                placeholder="123456"
              />
            )}
          </Field>
          <Button type="submit" disabled={verifying} className="sm:w-auto">
            {verifying ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            Verify
          </Button>
        </form>
      )}

      {requestState.status === "success" ? (
        <p className="text-ink-muted mt-2 text-xs">{requestState.message}</p>
      ) : requestState.status === "error" ? (
        <p role="alert" className="text-danger mt-2 text-xs">
          {requestState.message}
        </p>
      ) : null}

      {verifyState.status === "error" ? (
        <p role="alert" className="text-danger mt-2 text-xs">
          {verifyState.message}
        </p>
      ) : null}
    </div>
  );
}
