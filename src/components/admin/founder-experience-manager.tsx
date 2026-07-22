"use client";

import { Loader2, Plus } from "lucide-react";
import * as React from "react";
import { useActionState, useEffect } from "react";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { deleteExperience, upsertExperience } from "@/lib/admin/site-content-actions";
import type { FounderExperience } from "@/lib/data/site-content";

function ExperienceForm({
  entry,
  onDone,
}: {
  entry?: FounderExperience;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(upsertExperience, idleResult);

  useEffect(() => {
    if (state.status === "success") onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={action}
      className="grid gap-3 sm:grid-cols-[1fr_2fr_2fr_1fr_auto] sm:items-end"
    >
      {entry ? <input type="hidden" name="id" value={entry.id} /> : null}
      <Field
        label="Period"
        hint="e.g. 2026 - Present"
        error={state.status === "error" ? state.fieldErrors?.period : undefined}
      >
        {(props) => (
          <Input {...props} name="period" required defaultValue={entry?.period} />
        )}
      </Field>
      <Field
        label="Role"
        error={state.status === "error" ? state.fieldErrors?.roleTitle : undefined}
      >
        {(props) => (
          <Input {...props} name="roleTitle" required defaultValue={entry?.role_title} />
        )}
      </Field>
      <Field
        label="Organisation"
        error={state.status === "error" ? state.fieldErrors?.org : undefined}
      >
        {(props) => <Input {...props} name="org" required defaultValue={entry?.org} />}
      </Field>
      <Field label="Sort order">
        {(props) => (
          <Input
            {...props}
            name="sortOrder"
            type="number"
            defaultValue={entry?.sort_order ?? 0}
          />
        )}
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          Save
        </Button>
        {onDone ? (
          <button
            type="button"
            onClick={onDone}
            className="text-ink-subtle text-xs hover:underline"
          >
            Cancel
          </button>
        ) : null}
      </div>
      {state.status === "error" ? (
        <p className="text-danger text-xs sm:col-span-5">{state.message}</p>
      ) : null}
    </form>
  );
}

export function FounderExperienceManager({ entries }: { entries: FounderExperience[] }) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  return (
    <div className="border-line bg-surface rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Experience</h2>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-ink-muted inline-flex items-center gap-1.5 text-xs font-medium hover:text-teal-700"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add entry
          </button>
        ) : null}
      </div>

      {adding ? (
        <div className="border-line mt-4 border-t pt-4">
          <ExperienceForm onDone={() => setAdding(false)} />
        </div>
      ) : null}

      <ul className="border-line mt-4 divide-y divide-[var(--color-line)] border-t">
        {entries.map((entry) =>
          editingId === entry.id ? (
            <li key={entry.id} className="py-4">
              <ExperienceForm entry={entry} onDone={() => setEditingId(null)} />
            </li>
          ) : (
            <li key={entry.id} className="flex items-center gap-3 py-3">
              <div className="flex-1">
                <p className="text-ink-subtle text-xs">{entry.period}</p>
                <p className="text-sm font-medium">{entry.role_title}</p>
                <p className="text-ink-muted text-xs">{entry.org}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingId(entry.id)}
                className="text-xs text-teal-700 hover:underline"
              >
                Edit
              </button>
              <ConfirmDeleteButton
                label="Delete experience entry"
                confirmMessage={`Delete "${entry.role_title}"?`}
                onDelete={() => deleteExperience(entry.id)}
              />
            </li>
          ),
        )}
        {entries.length === 0 ? (
          <li className="text-ink-muted py-6 text-center text-sm">No entries yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
