"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { CheckboxField, Field, Input, Select, Textarea } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { upsertSession } from "@/lib/admin/sessions-actions";
import type { Database } from "@/lib/supabase/database.types";

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];

/**
 * Formats an ISO timestamp for a `datetime-local` input as Asia/Colombo wall
 * time — not the browser's own local time. This is a scheduling tool for a
 * Sri Lanka-based team; the admin's own timezone (and the server's, which on
 * Vercel is UTC) must not silently shift what "11:10" means. Sri Lanka has no
 * DST, so a fixed +05:30 offset is safe: add it to the UTC instant, then read
 * the numbers back as if they were UTC.
 */
function toColomboInputValue(iso: string): string {
  const shifted = new Date(new Date(iso).getTime() + 5.5 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

export function SessionForm({
  session,
  courses,
}: {
  session?: SessionRow;
  courses: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState(upsertSession, idleResult);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={action} className="flex flex-col gap-6">
      {session ? <input type="hidden" name="id" value={session.id} /> : null}

      {state.status === "error" && !state.fieldErrors ? (
        <p
          role="alert"
          className="border-danger/20 bg-danger-soft text-danger rounded-xl border px-4 py-3 text-sm"
        >
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p className="border-success/20 bg-success-soft text-success rounded-xl border px-4 py-3 text-sm">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Title" required error={fieldErrors?.title}>
          {(props) => (
            <Input {...props} name="title" required defaultValue={session?.title} />
          )}
        </Field>
        <Field
          label="Slug"
          required
          error={fieldErrors?.slug}
          hint="Used in the URL, e.g. intro-to-docker"
        >
          {(props) => (
            <Input {...props} name="slug" required defaultValue={session?.slug} />
          )}
        </Field>
      </div>

      <Field label="Description" error={fieldErrors?.description}>
        {(props) => (
          <Textarea
            {...props}
            name="description"
            rows={4}
            defaultValue={session?.description ?? ""}
          />
        )}
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Starts at"
          required
          error={fieldErrors?.startsAt}
          hint="Asia/Colombo time"
        >
          {(props) => (
            <Input
              {...props}
              type="datetime-local"
              name="startsAt"
              required
              defaultValue={session ? toColomboInputValue(session.starts_at) : ""}
            />
          )}
        </Field>
        <Field label="Duration (minutes)">
          {(props) => (
            <Input
              {...props}
              name="durationMinutes"
              type="number"
              defaultValue={session?.duration_minutes ?? 60}
            />
          )}
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Host name">
          {(props) => (
            <Input {...props} name="hostName" defaultValue={session?.host_name ?? ""} />
          )}
        </Field>
        <Field label="Capacity" hint="Leave blank for unlimited">
          {(props) => (
            <Input
              {...props}
              name="capacity"
              type="number"
              defaultValue={session?.capacity ?? ""}
            />
          )}
        </Field>
      </div>

      <Field
        label="Join URL"
        error={fieldErrors?.joinUrl}
        hint="Zoom/Meet link — only shown to registered students once the session is live or starting soon"
      >
        {(props) => (
          <Input
            {...props}
            name="joinUrl"
            type="url"
            defaultValue={session?.join_url ?? ""}
          />
        )}
      </Field>

      <Field
        label="Recording URL"
        error={fieldErrors?.recordingUrl}
        hint="Add once the session is completed"
      >
        {(props) => (
          <Input
            {...props}
            name="recordingUrl"
            type="url"
            defaultValue={session?.recording_url ?? ""}
          />
        )}
      </Field>

      <Field
        label="Cover image URL"
        error={fieldErrors?.coverImageUrl}
        hint="Paste a Cloudinary link (https://res.cloudinary.com/...) — shown on the session card"
      >
        {(props) => (
          <Input
            {...props}
            name="coverImageUrl"
            type="url"
            placeholder="https://res.cloudinary.com/..."
            defaultValue={session?.cover_image_path ?? ""}
          />
        )}
      </Field>

      <Field
        label="Associated course"
        hint="Optional — links this session from that course's page"
      >
        {(props) => (
          <Select {...props} name="courseId" defaultValue={session?.course_id ?? ""}>
            <option value="">None</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <CheckboxField
        name="isFree"
        label="This session is free"
        defaultChecked={session?.is_free ?? true}
      />

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        {session ? "Save session" : "Create session"}
      </Button>
    </form>
  );
}
