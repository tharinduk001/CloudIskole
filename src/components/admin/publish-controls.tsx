"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions/result";
import type { Database } from "@/lib/supabase/database.types";

type Status = Database["public"]["Enums"]["content_status"];

const options: { value: Status; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Publish" },
  { value: "archived", label: "Archive" },
];

export function PublishControls({
  status,
  onChange,
}: {
  status: Status;
  onChange: (next: Status) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Tracks which button triggered the transition, so only that one shows a
  // spinner — `pending` alone can't tell the three buttons apart.
  const [pendingValue, setPendingValue] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  function change(next: Status) {
    setError(null);
    setPendingValue(next);
    startTransition(async () => {
      const result = await onChange(next);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {options.map((o) => (
          <Button
            key={o.value}
            type="button"
            size="sm"
            variant={status === o.value ? "primary" : "secondary"}
            disabled={pending || status === o.value}
            onClick={() => change(o.value)}
          >
            {pending && pendingValue === o.value ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : null}
            {o.label}
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
