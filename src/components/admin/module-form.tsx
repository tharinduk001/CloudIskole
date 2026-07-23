"use client";

import { Loader2, Plus } from "lucide-react";
import * as React from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { upsertModule } from "@/lib/admin/courses-actions";
import type { AdminModule } from "@/lib/data/admin";

export function ModuleForm({
  courseId,
  module: mod,
  onDone,
}: {
  courseId: string;
  module?: AdminModule;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(upsertModule, idleResult);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      onDone?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className={
        mod
          ? "border-line bg-paper flex flex-col gap-4 rounded-xl border p-4"
          : "border-line flex flex-wrap items-end gap-3 rounded-xl border border-dashed p-4"
      }
    >
      {mod ? <input type="hidden" name="id" value={mod.id} /> : null}
      <input type="hidden" name="courseId" value={courseId} />
      <div className="flex flex-wrap items-end gap-3">
        <Field label={mod ? "Title" : "New module title"} className="min-w-48 flex-1">
          {(props) => (
            <Input
              {...props}
              name="title"
              required
              placeholder="Module title"
              defaultValue={mod?.title}
            />
          )}
        </Field>
        <Field label="Sort order" className="w-28">
          {(props) => (
            <Input
              {...props}
              name="sortOrder"
              type="number"
              defaultValue={mod?.sort_order ?? 0}
            />
          )}
        </Field>
      </div>
      {mod ? (
        <Field label="Summary" hint="Optional, shown to students">
          {(props) => (
            <Textarea {...props} name="summary" rows={2} defaultValue={mod.summary ?? ""} />
          )}
        </Field>
      ) : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : mod ? null : (
            <Plus aria-hidden="true" />
          )}
          {mod ? "Save module" : "Add module"}
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
        <p role="alert" className="text-danger w-full text-xs">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
