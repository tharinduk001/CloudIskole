"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { markAttendance } from "@/lib/admin/sessions-actions";

export function AttendanceToggle({
  sessionId,
  userId,
  attended,
}: {
  sessionId: string;
  userId: string;
  attended: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 rounded accent-teal-600"
          checked={attended}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.checked;
            setError(null);
            startTransition(async () => {
              const result = await markAttendance(sessionId, userId, next);
              if (result.status === "error") {
                setError(result.message);
                return;
              }
              router.refresh();
            });
          }}
        />
        Attended
      </label>
      {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
      {error ? <span className="text-danger text-xs">{error}</span> : null}
    </div>
  );
}
