"use client";

import { Loader2, Upload } from "lucide-react";
import * as React from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { submitPaymentSlip } from "@/lib/payments/actions";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

/**
 * Uploads a deposit slip straight from the browser to the private
 * `payment-slips` bucket, then hands the resulting path to
 * `submitPaymentSlip()` to record against the order.
 *
 * Same shape as `AvatarUploader`: the upload bypasses our server entirely —
 * the bucket's own RLS policy is the actual authority on whether a student
 * may write into `payment-slips/<their-user-id>/...`.
 */
export function SlipUploader({
  userId,
  orderId,
  rejectReason,
}: {
  userId: string;
  orderId: string;
  rejectReason?: string | null;
}) {
  const [state, action] = useActionState(submitPaymentSlip, idleResult);
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setError(null);
    if (!f) return;

    if (!ALLOWED_TYPES.has(f.type)) {
      setError("Please upload a JPG, PNG, WEBP or PDF file.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("That file is larger than 5MB.");
      return;
    }
    setFile(f);
  }

  async function onSubmit(formData: FormData) {
    if (!file) {
      setError("Please choose a file first.");
      return;
    }

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${orderId}/slip-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-slips")
      .upload(path, file, { upsert: false });

    setUploading(false);

    if (uploadError) {
      setError("Upload failed. Please try again.");
      return;
    }

    formData.set("slipPath", `payment-slips/${path}`);
    React.startTransition(() => {
      action(formData);
    });
  }

  if (state.status === "success") {
    return (
      <div className="border-line bg-surface rounded-2xl border p-5">
        <p className="text-ink text-sm font-medium">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="border-line bg-surface rounded-2xl border p-5">
      <h3 className="text-ink text-sm font-semibold">Upload your deposit slip</h3>
      {rejectReason ? (
        <p className="text-danger mt-1 text-xs">
          Your previous slip was declined: {rejectReason}. Please upload a new one.
        </p>
      ) : (
        <p className="text-ink-muted mt-1 text-xs leading-relaxed">
          A photo or PDF of your bank transfer receipt, showing the amount and reference code.
        </p>
      )}

      <form ref={formRef} action={onSubmit} className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="slipPath" />

        <Field label="Receipt / slip" required>
          {(props) => (
            <input
              {...props}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={onFileChange}
              className="text-ink-muted file:border-line-strong file:bg-paper file:text-ink w-full text-sm file:mr-3 file:rounded-full file:border file:px-3 file:py-1.5 file:text-xs file:font-medium"
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Depositor name" hint="Optional">
            {(props) => <Input {...props} name="depositorName" />}
          </Field>
          <Field label="Amount deposited (Rs)" hint="Optional">
            {(props) => <Input {...props} name="amountDeclared" type="number" step="0.01" />}
          </Field>
        </div>
        <Field label="Deposit date" hint="Optional">
          {(props) => <Input {...props} name="depositedAt" type="date" className="max-w-48" />}
        </Field>

        <Button type="submit" disabled={uploading} className="w-full sm:w-auto">
          {uploading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
          Submit for review
        </Button>

        {error ? (
          <p role="alert" className="text-danger text-xs">
            {error}
          </p>
        ) : null}
        {state.status === "error" ? (
          <p role="alert" className="text-danger text-xs">
            {state.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
