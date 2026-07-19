"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { CheckboxField, Field, Input, Select, Textarea } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { upsertLesson } from "@/lib/admin/courses-actions";
import type { LessonRow } from "@/lib/data/courses";

export function LessonForm({
  courseId,
  moduleId,
  lesson,
  onDone,
}: {
  courseId: string;
  moduleId: string;
  lesson?: LessonRow;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(upsertLesson, idleResult);
  const [type, setType] = React.useState<LessonRow["type"]>(lesson?.type ?? "video");

  React.useEffect(() => {
    if (state.status === "success") onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={action}
      className="border-line bg-paper flex flex-col gap-4 rounded-xl border p-4"
    >
      {lesson ? <input type="hidden" name="id" value={lesson.id} /> : null}
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="moduleId" value={moduleId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" required>
          {(props) => (
            <Input {...props} name="title" required defaultValue={lesson?.title} />
          )}
        </Field>
        <Field label="Slug" required hint="Unique within the course">
          {(props) => (
            <Input {...props} name="slug" required defaultValue={lesson?.slug} />
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Type" required>
          {(props) => (
            <Select
              {...props}
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as LessonRow["type"])}
            >
              <option value="video">Video (YouTube)</option>
              <option value="text">Text (MDX)</option>
              <option value="pdf">PDF</option>
            </Select>
          )}
        </Field>
        <Field label="Duration (seconds)">
          {(props) => (
            <Input
              {...props}
              name="durationSeconds"
              type="number"
              defaultValue={lesson?.duration_seconds ?? ""}
            />
          )}
        </Field>
        <Field label="Sort order">
          {(props) => (
            <Input
              {...props}
              name="sortOrder"
              type="number"
              defaultValue={lesson?.sort_order ?? 0}
            />
          )}
        </Field>
      </div>

      {type === "video" ? (
        <Field
          label="YouTube video id"
          required
          hint="The 11-character id, e.g. dQw4w9WgXcQ"
        >
          {(props) => (
            <Input {...props} name="youtubeId" defaultValue={lesson?.youtube_id ?? ""} />
          )}
        </Field>
      ) : type === "text" ? (
        <Field label="Lesson content (MDX)" required>
          {(props) => (
            <Textarea
              {...props}
              name="contentMdx"
              rows={10}
              defaultValue={lesson?.content_mdx ?? ""}
            />
          )}
        </Field>
      ) : (
        <Field
          label="Attachment path"
          required
          hint="Path inside the private course-assets bucket"
        >
          {(props) => (
            <Input
              {...props}
              name="attachmentPath"
              placeholder={`${courseId}/lesson.pdf`}
              defaultValue={lesson?.attachment_path ?? ""}
            />
          )}
        </Field>
      )}

      <CheckboxField
        name="isPreview"
        label="Free preview"
        description="Visible to anyone, even without enrolling"
        defaultChecked={lesson?.is_preview ?? false}
      />

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending} className="self-start">
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {lesson ? "Save lesson" : "Add lesson"}
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
        <p role="alert" className="text-danger text-xs">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
