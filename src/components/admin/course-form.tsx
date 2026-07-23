"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { CheckboxField, Field, Input, Select, Textarea } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { upsertCourse } from "@/lib/admin/courses-actions";
import type { CourseSummary } from "@/lib/data/courses";
import { useAutoSlug } from "@/hooks/use-auto-slug";

export function CourseForm({ course }: { course?: CourseSummary }) {
  const [state, action, pending] = useActionState(upsertCourse, idleResult);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;
  const { slug, onTitleChange, onSlugChange } = useAutoSlug(course?.slug);

  return (
    <form action={action} className="flex flex-col gap-6">
      {course ? <input type="hidden" name="id" value={course.id} /> : null}

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
            <Input
              {...props}
              name="title"
              required
              defaultValue={course?.title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          )}
        </Field>
        <Field
          label="Slug"
          required
          error={fieldErrors?.slug}
          hint="Auto-generated from the title - edit if you need a different one"
        >
          {(props) => (
            <Input {...props} name="slug" required value={slug} onChange={onSlugChange} />
          )}
        </Field>
      </div>

      <Field label="Subtitle" error={fieldErrors?.subtitle}>
        {(props) => (
          <Input {...props} name="subtitle" defaultValue={course?.subtitle ?? ""} />
        )}
      </Field>

      <Field label="Description" error={fieldErrors?.description}>
        {(props) => (
          <Textarea
            {...props}
            name="description"
            rows={5}
            defaultValue={course?.description ?? ""}
          />
        )}
      </Field>

      <Field
        label="Cover image URL"
        error={fieldErrors?.thumbnailUrl}
        hint="Paste a Cloudinary link (https://res.cloudinary.com/...) - shown on the course card and detail page"
      >
        {(props) => (
          <Input
            {...props}
            name="thumbnailUrl"
            type="url"
            placeholder="https://res.cloudinary.com/..."
            defaultValue={course?.thumbnail_path ?? ""}
          />
        )}
      </Field>

      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Level" required>
          {(props) => (
            <Select {...props} name="level" defaultValue={course?.level ?? "beginner"}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          )}
        </Field>
        <Field label="Category">
          {(props) => (
            <Input {...props} name="category" defaultValue={course?.category ?? ""} />
          )}
        </Field>
        <Field label="Duration (minutes)">
          {(props) => (
            <Input
              {...props}
              name="durationMinutes"
              type="number"
              defaultValue={course?.duration_minutes ?? ""}
            />
          )}
        </Field>
      </div>

      <Field
        label="Price (Rs)"
        hint="Ignored when marked free"
        error={fieldErrors?.priceRupees}
      >
        {(props) => (
          <Input
            {...props}
            name="priceRupees"
            type="number"
            step="0.01"
            defaultValue={course ? course.price_cents / 100 : ""}
          />
        )}
      </Field>

      <CheckboxField
        name="isFree"
        label="This is a free course"
        defaultChecked={course?.is_free ?? false}
      />

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        {course ? "Save course" : "Create course"}
      </Button>
    </form>
  );
}
