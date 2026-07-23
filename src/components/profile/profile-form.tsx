"use client";

import { CheckCircle2, Loader2, ShieldCheck, ShieldQuestion } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { CheckboxField, Field, Input } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { updateProfile } from "@/lib/profile/actions";
import type { Profile } from "@/lib/data/auth";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, idleResult);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={action} className="flex flex-col gap-6">
      {state.status === "success" ? (
        <p
          role="status"
          className="border-success/20 bg-success-soft text-success inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm"
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {state.message}
        </p>
      ) : null}
      {state.status === "error" && !state.fieldErrors ? (
        <p
          role="alert"
          className="border-danger/20 bg-danger-soft text-danger rounded-xl border px-4 py-3 text-sm"
        >
          {state.message}
        </p>
      ) : null}

      <Field label="Email" hint="Your sign-in email cannot be changed here.">
        {(props) => <Input {...props} value={profile.email} disabled readOnly />}
      </Field>

      <Field label="Full name" required error={fieldErrors?.fullName}>
        {(props) => (
          <Input
            {...props}
            name="fullName"
            required
            maxLength={120}
            defaultValue={profile.full_name}
          />
        )}
      </Field>

      <div>
        <span className="text-ink text-sm font-medium">Mobile number</span>
        <div className="border-line-strong bg-paper mt-2 flex items-center justify-between rounded-xl border px-4 py-3">
          <span className="text-ink-muted text-sm">
            {profile.phone ?? "Not added yet"}
          </span>
          {profile.phone ? (
            profile.phone_verified_at ? (
              <span className="text-success inline-flex items-center gap-1.5 text-xs font-medium">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Verified
              </span>
            ) : (
              <span className="text-warning inline-flex items-center gap-1.5 text-xs font-medium">
                <ShieldQuestion className="size-4" aria-hidden="true" />
                Not verified yet
              </span>
            )
          ) : null}
        </div>
        <p className="text-ink-subtle mt-1.5 text-xs">
          Add and verify your number when you enrol in your first course.
        </p>
      </div>

      <div className="border-line flex flex-col gap-4 border-t pt-6">
        <CheckboxField
          name="leaderboardOptIn"
          label="Show me on the public leaderboard"
          description="Off by default. Your name is shown if you turn this on."
          defaultChecked={profile.leaderboard_opt_in}
        />
        <CheckboxField
          name="marketingOptIn"
          label="Send me course announcements and tips"
          description="You'll always get essential enrolment and payment messages regardless."
        />
      </div>

      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        Save changes
      </Button>
    </form>
  );
}
