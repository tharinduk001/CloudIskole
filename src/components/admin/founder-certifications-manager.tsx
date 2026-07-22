"use client";

import { Loader2, Plus } from "lucide-react";
import * as React from "react";
import { useActionState, useEffect } from "react";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import {
  deleteCertification,
  upsertCertification,
} from "@/lib/admin/site-content-actions";
import type { FounderCertification } from "@/lib/data/site-content";

function CertificationForm({
  cert,
  onDone,
}: {
  cert?: FounderCertification;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(upsertCertification, idleResult);

  useEffect(() => {
    if (state.status === "success") onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      {cert ? <input type="hidden" name="id" value={cert.id} /> : null}
      <Field
        label="Certification"
        className="min-w-56 flex-1"
        error={state.status === "error" ? state.fieldErrors?.label : undefined}
      >
        {(props) => <Input {...props} name="label" required defaultValue={cert?.label} />}
      </Field>
      <Field label="Sort order">
        {(props) => (
          <Input
            {...props}
            name="sortOrder"
            type="number"
            className="w-24"
            defaultValue={cert?.sort_order ?? 0}
          />
        )}
      </Field>
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
    </form>
  );
}

export function FounderCertificationsManager({
  certifications,
}: {
  certifications: FounderCertification[];
}) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  return (
    <div className="border-line bg-surface rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Certifications</h2>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-ink-muted inline-flex items-center gap-1.5 text-xs font-medium hover:text-teal-700"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add certification
          </button>
        ) : null}
      </div>

      {adding ? (
        <div className="border-line mt-4 border-t pt-4">
          <CertificationForm onDone={() => setAdding(false)} />
        </div>
      ) : null}

      <ul className="border-line mt-4 divide-y divide-[var(--color-line)] border-t">
        {certifications.map((cert) =>
          editingId === cert.id ? (
            <li key={cert.id} className="py-4">
              <CertificationForm cert={cert} onDone={() => setEditingId(null)} />
            </li>
          ) : (
            <li key={cert.id} className="flex items-center gap-3 py-3">
              <span className="flex-1 text-sm font-medium">{cert.label}</span>
              <button
                type="button"
                onClick={() => setEditingId(cert.id)}
                className="text-xs text-teal-700 hover:underline"
              >
                Edit
              </button>
              <ConfirmDeleteButton
                label="Delete certification"
                confirmMessage={`Delete "${cert.label}"?`}
                onDelete={() => deleteCertification(cert.id)}
              />
            </li>
          ),
        )}
        {certifications.length === 0 ? (
          <li className="text-ink-muted py-6 text-center text-sm">
            No certifications yet.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
