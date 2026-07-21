"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { setSessionStatus } from "@/lib/admin/sessions-actions";
import type { Database } from "@/lib/supabase/database.types";

type SessionStatus = Database["public"]["Enums"]["session_status"];

const nextSteps: Partial<
  Record<
    SessionStatus,
    { to: SessionStatus; label: string; variant: "primary" | "danger" }[]
  >
> = {
  upcoming: [
    { to: "live", label: "Start session", variant: "primary" },
    { to: "cancelled", label: "Cancel", variant: "danger" },
  ],
  live: [
    { to: "completed", label: "Mark completed", variant: "primary" },
    { to: "cancelled", label: "Cancel", variant: "danger" },
  ],
};

export function SessionStatusControls({
  sessionId,
  status,
}: {
  sessionId: string;
  status: SessionStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Tracks which step triggered the transition, so only that button shows a
  // spinner — `pending` alone can't tell the buttons apart.
  const [pendingTo, setPendingTo] = useState<SessionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const steps = nextSteps[status] ?? [];
  if (steps.length === 0) {
    return <span className="text-ink-subtle text-sm capitalize">{status}</span>;
  }

  function go(to: SessionStatus) {
    setError(null);
    setPendingTo(to);
    startTransition(async () => {
      const result = await setSessionStatus(sessionId, status, to);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {steps.map((step) => (
          <Button
            key={step.to}
            type="button"
            size="sm"
            variant={step.variant}
            disabled={pending}
            onClick={() => go(step.to)}
          >
            {pending && pendingTo === step.to ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : null}
            {step.label}
          </Button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
