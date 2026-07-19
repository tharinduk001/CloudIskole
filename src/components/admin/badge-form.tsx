"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { deleteBadge, upsertBadge } from "@/lib/admin/gamification-actions";
import type { Database } from "@/lib/supabase/database.types";

type BadgeRow = Database["public"]["Tables"]["badges"]["Row"];

export function BadgeForm({ badge }: { badge?: BadgeRow }) {
  const [state, action, pending] = useActionState(upsertBadge, idleResult);
  const router = useRouter();
  const [deletePending, startDeleteTransition] = useTransition();
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={action} className="flex flex-col gap-4">
      {badge ? <input type="hidden" name="id" value={badge.id} /> : null}

      {state.status === "error" && !state.fieldErrors ? (
        <p role="alert" className="text-danger text-xs">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[4rem_1fr_1fr]">
        <Field label="Icon" hint="Emoji">
          {(props) => (
            <Input
              {...props}
              name="icon"
              maxLength={8}
              defaultValue={badge?.icon ?? ""}
            />
          )}
        </Field>
        <Field label="Name" required error={fieldErrors?.name}>
          {(props) => (
            <Input {...props} name="name" required defaultValue={badge?.name} />
          )}
        </Field>
        <Field label="Slug" required error={fieldErrors?.slug}>
          {(props) => (
            <Input {...props} name="slug" required defaultValue={badge?.slug} />
          )}
        </Field>
      </div>

      <Field label="Description" error={fieldErrors?.description}>
        {(props) => (
          <Input {...props} name="description" defaultValue={badge?.description ?? ""} />
        )}
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {badge ? "Save badge" : "Create badge"}
        </Button>
        {badge ? (
          <button
            type="button"
            disabled={deletePending}
            onClick={() => {
              if (
                !window.confirm(
                  `Delete the "${badge.name}" badge? This also removes it from anyone who earned it.`,
                )
              )
                return;
              startDeleteTransition(async () => {
                await deleteBadge(badge.id);
                router.refresh();
              });
            }}
            className="text-ink-subtle hover:text-danger inline-flex items-center gap-1.5 text-xs disabled:opacity-50"
          >
            {deletePending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-3.5" aria-hidden="true" />
            )}
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
