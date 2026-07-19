"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { revokeCertificate, setCertificateExternalBadgeUrl } from "@/lib/admin/gamification-actions";

export function CertificateRowActions({
  certificateId,
  revoked,
  externalBadgeUrl,
}: {
  certificateId: string;
  revoked: boolean;
  externalBadgeUrl: string | null;
}) {
  const [badgeState, badgeAction, badgePending] = useActionState(setCertificateExternalBadgeUrl, idleResult);
  const [revokeState, revokeAction, revokePending] = useActionState(revokeCertificate, idleResult);
  const [showRevoke, setShowRevoke] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <form action={badgeAction} className="flex items-center gap-2">
        <input type="hidden" name="certificateId" value={certificateId} />
        <Input
          name="externalBadgeUrl"
          type="url"
          placeholder="External badge URL"
          defaultValue={externalBadgeUrl ?? ""}
          className="h-8 w-56 text-xs"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={badgePending}>
          {badgePending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : "Save"}
        </Button>
      </form>
      {badgeState.status === "error" ? <p className="text-danger text-xs">{badgeState.message}</p> : null}

      {revoked ? (
        <span className="text-danger text-xs font-medium">Revoked</span>
      ) : showRevoke ? (
        <form action={revokeAction} className="flex items-center gap-2">
          <input type="hidden" name="certificateId" value={certificateId} />
          <Input name="reason" placeholder="Reason" required className="h-8 w-40 text-xs" />
          <Button type="submit" size="sm" variant="danger" disabled={revokePending}>
            {revokePending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : "Confirm"}
          </Button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowRevoke(true)}
          className="text-danger self-start text-xs hover:underline"
        >
          Revoke
        </button>
      )}
      {revokeState.status === "error" ? <p className="text-danger text-xs">{revokeState.message}</p> : null}
    </div>
  );
}
