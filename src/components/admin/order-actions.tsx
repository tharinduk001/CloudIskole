"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import * as React from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { approveOrder, rejectOrder } from "@/lib/admin/orders-actions";

export function OrderActions({ orderId }: { orderId: string }) {
  const [approveState, approveAction, approving] = useActionState(
    approveOrder,
    idleResult,
  );
  const [rejectState, rejectAction, rejecting] = useActionState(rejectOrder, idleResult);
  const [showReject, setShowReject] = React.useState(false);

  if (approveState.status === "success") {
    return (
      <p className="bg-success-soft text-success inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
        <CheckCircle2 className="size-4" aria-hidden="true" />
        {approveState.message}
      </p>
    );
  }

  if (rejectState.status === "success") {
    return (
      <p className="bg-danger-soft text-danger inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
        <XCircle className="size-4" aria-hidden="true" />
        {rejectState.message}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <form action={approveAction}>
          <input type="hidden" name="orderId" value={orderId} />
          <Button type="submit" disabled={approving || rejecting}>
            {approving ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 aria-hidden="true" />
            )}
            Approve &amp; grant enrollment
          </Button>
        </form>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowReject((v) => !v)}
          disabled={approving || rejecting}
        >
          <XCircle aria-hidden="true" />
          Reject
        </Button>
      </div>

      {approveState.status === "error" ? (
        <p role="alert" className="text-danger text-sm">
          {approveState.message}
        </p>
      ) : null}

      {showReject ? (
        <form
          action={rejectAction}
          className="border-line flex flex-col gap-3 rounded-xl border p-4"
        >
          <input type="hidden" name="orderId" value={orderId} />
          <Field label="Reason for rejection" required>
            {(props) => <Textarea {...props} name="reason" required maxLength={500} />}
          </Field>
          <Button
            type="submit"
            variant="danger"
            disabled={rejecting}
            className="self-start"
          >
            {rejecting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            Confirm rejection
          </Button>
          {rejectState.status === "error" ? (
            <p role="alert" className="text-danger text-sm">
              {rejectState.message}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
