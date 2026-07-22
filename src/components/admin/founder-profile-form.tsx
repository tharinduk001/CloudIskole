"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { updateFounderProfile } from "@/lib/admin/site-content-actions";
import type { FounderProfile } from "@/lib/data/site-content";

export function FounderProfileForm({ profile }: { profile: FounderProfile }) {
  const [state, action, pending] = useActionState(updateFounderProfile, idleResult);

  return (
    <div
      className="border-line bg-surface rounded-2xl border p-5"
      data-testid="founder-profile-form"
    >
      <h2 className="font-display text-lg font-semibold">Founder profile</h2>
      <form action={action} className="mt-4 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Name"
            error={state.status === "error" ? state.fieldErrors?.name : undefined}
          >
            {(props) => (
              <Input {...props} name="name" required defaultValue={profile.name} />
            )}
          </Field>
          <Field
            label="Title"
            hint="Shown under the name"
            error={state.status === "error" ? state.fieldErrors?.title : undefined}
          >
            {(props) => (
              <Input {...props} name="title" required defaultValue={profile.title} />
            )}
          </Field>
        </div>
        <Field
          label="Photo URL"
          hint="Cloudinary link"
          error={state.status === "error" ? state.fieldErrors?.photoUrl : undefined}
        >
          {(props) => (
            <Input
              {...props}
              name="photoUrl"
              type="url"
              required
              placeholder="https://res.cloudinary.com/..."
              defaultValue={profile.photo_url}
            />
          )}
        </Field>
        <Field
          label="Bio"
          hint="Separate paragraphs with a blank line"
          error={state.status === "error" ? state.fieldErrors?.bio : undefined}
        >
          {(props) => (
            <Textarea
              {...props}
              name="bio"
              rows={8}
              required
              defaultValue={profile.bio}
            />
          )}
        </Field>
        <Button type="submit" size="sm" disabled={pending} className="self-start">
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          Save profile
        </Button>
        {state.status === "success" ? (
          <p className="text-success text-xs">Saved.</p>
        ) : null}
        {state.status === "error" ? (
          <p className="text-danger text-xs">{state.message}</p>
        ) : null}
      </form>
    </div>
  );
}
