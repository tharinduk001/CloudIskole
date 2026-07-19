"use client";

import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { submitContactMessage } from "@/lib/contact/actions";

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContactMessage, idleResult);

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="border-success/20 bg-success-soft flex flex-col items-center rounded-2xl border px-6 py-12 text-center"
      >
        <CheckCircle2 className="text-success size-10" aria-hidden="true" />
        <h2 className="font-display mt-4 text-lg font-semibold">Message sent</h2>
        <p className="text-ink-muted mt-2 max-w-sm text-sm leading-relaxed">
          {state.message}
        </p>
      </div>
    );
  }

  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.status === "error" && !state.fieldErrors ? (
        <p
          role="alert"
          className="border-danger/20 bg-danger-soft text-danger rounded-xl border px-4 py-3 text-sm"
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" required error={fieldErrors?.name}>
          {(props) => (
            <Input {...props} name="name" autoComplete="name" required maxLength={120} />
          )}
        </Field>

        <Field label="Email address" required error={fieldErrors?.email}>
          {(props) => (
            <Input
              {...props}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
            />
          )}
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Mobile number"
          hint="Optional — helps us reply faster."
          error={fieldErrors?.phone}
        >
          {(props) => (
            <Input
              {...props}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="077 123 4567"
            />
          )}
        </Field>

        <Field label="Subject" error={fieldErrors?.subject}>
          {(props) => (
            <Input
              {...props}
              name="subject"
              maxLength={200}
              placeholder="How can we help?"
            />
          )}
        </Field>
      </div>

      <Field label="Message" required error={fieldErrors?.message}>
        {(props) => (
          <Textarea
            {...props}
            name="message"
            required
            minLength={10}
            maxLength={4000}
            placeholder="Tell us what you'd like to know…"
          />
        )}
      </Field>

      {/* Honeypot. Hidden from sight and from screen readers, but a bot that
          fills every input will fill this one and be silently discarded. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Do not fill this in</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Button type="submit" size="lg" disabled={pending} className="sm:self-start">
        {pending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <Send aria-hidden="true" />
        )}
        Send message
      </Button>
    </form>
  );
}
