"use client";

import { Loader2, Plus } from "lucide-react";
import * as React from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { upsertModule } from "@/lib/admin/courses-actions";

export function ModuleForm({ courseId }: { courseId: string }) {
  const [state, action, pending] = useActionState(upsertModule, idleResult);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="border-line flex flex-wrap items-end gap-3 rounded-xl border border-dashed p-4"
    >
      <input type="hidden" name="courseId" value={courseId} />
      <Field label="New module title" className="min-w-48 flex-1">
        {(props) => <Input {...props} name="title" required placeholder="Module title" />}
      </Field>
      <Field label="Sort order" className="w-28">
        {(props) => <Input {...props} name="sortOrder" type="number" defaultValue={0} />}
      </Field>
      <Button type="submit" disabled={pending} size="sm">
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
        Add module
      </Button>
      {state.status === "error" ? (
        <p role="alert" className="text-danger w-full text-xs">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
