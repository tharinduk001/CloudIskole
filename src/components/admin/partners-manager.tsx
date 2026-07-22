"use client";

import { Loader2, Plus } from "lucide-react";
import * as React from "react";
import { useActionState, useEffect } from "react";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { deletePartner, upsertPartner } from "@/lib/admin/site-content-actions";
import type { Partner } from "@/lib/data/site-content";

function PartnerForm({ partner, onDone }: { partner?: Partner; onDone?: () => void }) {
  const [state, action, pending] = useActionState(upsertPartner, idleResult);

  useEffect(() => {
    if (state.status === "success") onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={action}
      className="grid gap-3 sm:grid-cols-[2fr_3fr_1fr_auto] sm:items-end"
    >
      {partner ? <input type="hidden" name="id" value={partner.id} /> : null}
      <Field
        label="Name"
        error={state.status === "error" ? state.fieldErrors?.name : undefined}
      >
        {(props) => (
          <Input {...props} name="name" required defaultValue={partner?.name} />
        )}
      </Field>
      <Field
        label="Logo URL"
        hint="Cloudinary link"
        error={state.status === "error" ? state.fieldErrors?.logoUrl : undefined}
      >
        {(props) => (
          <Input
            {...props}
            name="logoUrl"
            type="url"
            required
            placeholder="https://res.cloudinary.com/..."
            defaultValue={partner?.logo_url}
          />
        )}
      </Field>
      <Field label="Sort order">
        {(props) => (
          <Input
            {...props}
            name="sortOrder"
            type="number"
            defaultValue={partner?.sort_order ?? 0}
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

export function PartnersManager({ partners }: { partners: Partner[] }) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  return (
    <div
      className="border-line bg-surface rounded-2xl border p-5"
      data-testid="partners-manager"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Partners</h2>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-ink-muted inline-flex items-center gap-1.5 text-xs font-medium hover:text-teal-700"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add partner
          </button>
        ) : null}
      </div>

      {adding ? (
        <div className="border-line mt-4 border-t pt-4">
          <PartnerForm onDone={() => setAdding(false)} />
        </div>
      ) : null}

      <ul className="border-line mt-4 divide-y divide-[var(--color-line)] border-t">
        {partners.map((partner) =>
          editingId === partner.id ? (
            <li key={partner.id} className="py-4">
              <PartnerForm partner={partner} onDone={() => setEditingId(null)} />
            </li>
          ) : (
            <li key={partner.id} className="flex items-center gap-3 py-3">
              <span className="border-line bg-paper relative h-10 w-20 shrink-0 overflow-hidden rounded-md border">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-entered Cloudinary URL, not a next/image remotePatterns candidate for this preview thumbnail */}
                <img
                  src={partner.logo_url}
                  alt=""
                  className="h-full w-full object-contain p-1"
                />
              </span>
              <span className="flex-1 text-sm font-medium">{partner.name}</span>
              <button
                type="button"
                onClick={() => setEditingId(partner.id)}
                className="text-xs text-teal-700 hover:underline"
              >
                Edit
              </button>
              <ConfirmDeleteButton
                label="Delete partner"
                confirmMessage={`Delete "${partner.name}"?`}
                onDelete={() => deletePartner(partner.id)}
              />
            </li>
          ),
        )}
        {partners.length === 0 ? (
          <li className="text-ink-muted py-6 text-center text-sm">No partners yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
