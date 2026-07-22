"use client";

import { Loader2, Plus } from "lucide-react";
import * as React from "react";
import { useActionState, useEffect } from "react";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { deleteHighlight, upsertHighlight } from "@/lib/admin/site-content-actions";
import type { Highlight } from "@/lib/data/site-content";

function HighlightForm({
  highlight,
  onDone,
}: {
  highlight?: Highlight;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(upsertHighlight, idleResult);

  useEffect(() => {
    if (state.status === "success") onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={action}
      className="grid gap-3 sm:grid-cols-[3fr_2fr_1fr_auto] sm:items-end"
    >
      {highlight ? <input type="hidden" name="id" value={highlight.id} /> : null}
      <Field
        label="Photo URL"
        hint="Cloudinary link"
        error={state.status === "error" ? state.fieldErrors?.src : undefined}
      >
        {(props) => (
          <Input
            {...props}
            name="src"
            type="url"
            required
            placeholder="https://res.cloudinary.com/..."
            defaultValue={highlight?.src}
          />
        )}
      </Field>
      <Field
        label="Caption"
        error={state.status === "error" ? state.fieldErrors?.alt : undefined}
      >
        {(props) => (
          <Input {...props} name="alt" required defaultValue={highlight?.alt} />
        )}
      </Field>
      <Field label="Sort order">
        {(props) => (
          <Input
            {...props}
            name="sortOrder"
            type="number"
            defaultValue={highlight?.sort_order ?? 0}
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
        <p className="text-danger text-xs sm:col-span-4">{state.message}</p>
      ) : null}
    </form>
  );
}

export function HighlightsManager({ highlights }: { highlights: Highlight[] }) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  return (
    <div className="border-line bg-surface rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Moments photos</h2>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-ink-muted inline-flex items-center gap-1.5 text-xs font-medium hover:text-teal-700"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add photo
          </button>
        ) : null}
      </div>

      {adding ? (
        <div className="border-line mt-4 border-t pt-4">
          <HighlightForm onDone={() => setAdding(false)} />
        </div>
      ) : null}

      <ul className="border-line mt-4 divide-y divide-[var(--color-line)] border-t">
        {highlights.map((highlight) =>
          editingId === highlight.id ? (
            <li key={highlight.id} className="py-4">
              <HighlightForm highlight={highlight} onDone={() => setEditingId(null)} />
            </li>
          ) : (
            <li key={highlight.id} className="flex items-center gap-3 py-3">
              <span className="border-line bg-paper relative h-10 w-14 shrink-0 overflow-hidden rounded-md border">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-entered Cloudinary URL, not a next/image remotePatterns candidate for this preview thumbnail */}
                <img src={highlight.src} alt="" className="h-full w-full object-cover" />
              </span>
              <span className="flex-1 text-sm font-medium">{highlight.alt}</span>
              <button
                type="button"
                onClick={() => setEditingId(highlight.id)}
                className="text-xs text-teal-700 hover:underline"
              >
                Edit
              </button>
              <ConfirmDeleteButton
                label="Delete photo"
                confirmMessage={`Delete "${highlight.alt}"?`}
                onDelete={() => deleteHighlight(highlight.id)}
              />
            </li>
          ),
        )}
        {highlights.length === 0 ? (
          <li className="text-ink-muted py-6 text-center text-sm">No photos yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
