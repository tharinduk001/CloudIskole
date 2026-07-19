"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { setCourseStatus } from "@/lib/admin/courses-actions";
import type { Database } from "@/lib/supabase/database.types";

type Status = Database["public"]["Enums"]["content_status"];

const options: { value: Status; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Publish" },
  { value: "archived", label: "Archive" },
];

export function PublishControls({ courseId, status }: { courseId: string; status: Status }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: Status) {
    setError(null);
    startTransition(async () => {
      const result = await setCourseStatus(courseId, next);
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
