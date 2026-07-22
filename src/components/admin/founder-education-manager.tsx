"use client";

import { Loader2, Plus } from "lucide-react";
import * as React from "react";
import { useActionState, useEffect } from "react";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { deleteEducation, upsertEducation } from "@/lib/admin/site-content-actions";
import type { FounderEducation } from "@/lib/data/site-content";

function EducationForm({
  entry,
  onDone,
}: {
  entry?: FounderEducation;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(upsertEducation, idleResult);

  useEffect(() => {
    if (state.status === "success") onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-3">
      {entry ? <input type="hidden" name="id" value={entry.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr_1fr]">
        <Field
          label="Period"
          hint="e.g. 2023 - 2027"
          error={state.status === "error" ? state.fieldErrors?.period : undefined}
        >
          {(props) => (
            <Input {...props} name="period" required defaultValue={entry?.period} />
          )}
        </Field>
        <Field
          label="Institution"
          error={state.status === "error" ? state.fieldErrors?.institution : undefined}
        >
          {(props) => (
            <Input
              {...props}
              name="institution"
              required
              defaultValue={entry?.institution}
            />
          )}
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
      </div>
      <Field
        label="Detail"
        error={state.status === "error" ? state.fieldErrors?.detail : undefined}
      >
        {(props) => (
          <Input {...props} name="detail" required defaultValue={entry?.detail} />
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
        {state.status === "error" ? (
          <span className="text-danger text-xs">{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}

export function FounderEducationManager({ entries }: { entries: FounderEducation[] }) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  return (
    <div className="border-line bg-surface rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Education</h2>
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
          <EducationForm onDone={() => setAdding(false)} />
        </div>
      ) : null}

      <ul className="border-line mt-4 divide-y divide-[var(--color-line)] border-t">
        {entries.map((entry) =>
          editingId === entry.id ? (
            <li key={entry.id} className="py-4">
              <EducationForm entry={entry} onDone={() => setEditingId(null)} />
            </li>
          ) : (
            <li key={entry.id} className="flex items-center gap-3 py-3">
              <div className="flex-1">
                <p className="text-ink-subtle text-xs">{entry.period}</p>
                <p className="text-sm font-medium">{entry.institution}</p>
                <p className="text-ink-muted text-xs">{entry.detail}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingId(entry.id)}
                className="text-xs text-teal-700 hover:underline"
              >
                Edit
              </button>
              <ConfirmDeleteButton
                label="Delete education entry"
                confirmMessage={`Delete "${entry.institution}"?`}
                onDelete={() => deleteEducation(entry.id)}
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
