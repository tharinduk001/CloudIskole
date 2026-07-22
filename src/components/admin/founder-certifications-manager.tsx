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
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state.status === "success") onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-3">
      {cert ? <input type="hidden" name="id" value={cert.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Certification name" error={fieldErrors?.label}>
          {(props) => (
            <Input {...props} name="label" required defaultValue={cert?.label} />
          )}
        </Field>
        <Field label="Provider / issuer" error={fieldErrors?.provider}>
          {(props) => (
            <Input {...props} name="provider" defaultValue={cert?.provider ?? ""} />
          )}
        </Field>
      </div>
      <Field
        label="Badge image URL"
        hint="Credly, CertDirectory, or any HTTPS image link"
        error={fieldErrors?.badgeImageUrl}
      >
        {(props) => (
          <Input
            {...props}
            name="badgeImageUrl"
            type="url"
            placeholder="https://images.credly.com/..."
            defaultValue={cert?.badge_image_url ?? ""}
          />
        )}
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Issued" error={fieldErrors?.issuedDate}>
          {(props) => (
            <Input
              {...props}
              name="issuedDate"
              type="date"
              defaultValue={cert?.issued_date ?? ""}
            />
          )}
        </Field>
        <Field
          label="Expires"
          hint="Leave blank if it never expires"
          error={fieldErrors?.expiryDate}
        >
          {(props) => (
            <Input
              {...props}
              name="expiryDate"
              type="date"
              defaultValue={cert?.expiry_date ?? ""}
            />
          )}
        </Field>
        <Field label="Sort order">
          {(props) => (
            <Input
              {...props}
              name="sortOrder"
              type="number"
              defaultValue={cert?.sort_order ?? 0}
            />
          )}
        </Field>
      </div>
      <Field
        label="Verify URL"
        hint="Link to the public credential page"
        error={fieldErrors?.verifyUrl}
      >
        {(props) => (
          <Input
            {...props}
            name="verifyUrl"
            type="url"
            placeholder="https://www.credly.com/badges/..."
            defaultValue={cert?.verify_url ?? ""}
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
        {state.status === "error" ? (
          <span className="text-danger text-xs">{state.message}</span>
        ) : null}
      </div>
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
              <span className="border-line bg-paper relative h-10 w-10 shrink-0 overflow-hidden rounded-md border">
                {cert.badge_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-entered badge artwork from Credly/CertDirectory/etc., not a next/image remotePatterns candidate for this preview thumbnail
                  <img
                    src={cert.badge_image_url}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                ) : null}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{cert.label}</p>
                <p className="text-ink-muted text-xs">
                  {cert.provider}
                  {cert.issued_date ? ` · Issued ${cert.issued_date}` : ""}
                </p>
              </div>
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
