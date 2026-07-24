"use client";

import { Loader2, Plus } from "lucide-react";
import * as React from "react";
import { useActionState, useEffect } from "react";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { deleteTestimonial, upsertTestimonial } from "@/lib/admin/site-content-actions";
import type { Testimonial } from "@/lib/data/site-content";

function TestimonialForm({
  testimonial,
  onDone,
}: {
  testimonial?: Testimonial;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(upsertTestimonial, idleResult);

  useEffect(() => {
    if (state.status === "success") onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} className="grid gap-3">
      {testimonial ? <input type="hidden" name="id" value={testimonial.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <Field
          label="Student name"
          error={state.status === "error" ? state.fieldErrors?.studentName : undefined}
        >
          {(props) => (
            <Input
              {...props}
              name="studentName"
              required
              defaultValue={testimonial?.student_name}
            />
          )}
        </Field>
        <Field label="Sort order">
          {(props) => (
            <Input
              {...props}
              name="sortOrder"
              type="number"
              defaultValue={testimonial?.sort_order ?? 0}
            />
          )}
        </Field>
      </div>
      <Field
        label="Review"
        error={state.status === "error" ? state.fieldErrors?.quote : undefined}
      >
        {(props) => (
          <Textarea
            {...props}
            name="quote"
            required
            rows={3}
            defaultValue={testimonial?.quote}
          />
        )}
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          Save
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
        <p className="text-danger text-xs">{state.message}</p>
      ) : null}
    </form>
  );
}

export function TestimonialsManager({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  return (
    <div
      className="border-line bg-surface rounded-2xl border p-5"
      data-testid="testimonials-manager"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Student reviews</h2>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-ink-muted inline-flex items-center gap-1.5 text-xs font-medium hover:text-teal-700"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add review
          </button>
        ) : null}
      </div>

      {adding ? (
        <div className="border-line mt-4 border-t pt-4">
          <TestimonialForm onDone={() => setAdding(false)} />
        </div>
      ) : null}

      <ul className="border-line mt-4 divide-y divide-[var(--color-line)] border-t">
        {testimonials.map((testimonial) =>
          editingId === testimonial.id ? (
            <li key={testimonial.id} className="py-4">
              <TestimonialForm
                testimonial={testimonial}
                onDone={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li key={testimonial.id} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{testimonial.student_name}</p>
                <p className="text-ink-muted mt-1 line-clamp-2 text-sm">
                  {testimonial.quote}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingId(testimonial.id)}
                className="shrink-0 text-xs text-teal-700 hover:underline"
              >
                Edit
              </button>
              <ConfirmDeleteButton
                label="Delete review"
                confirmMessage={`Delete ${testimonial.student_name}'s review?`}
                onDelete={() => deleteTestimonial(testimonial.id)}
              />
            </li>
          ),
        )}
        {testimonials.length === 0 ? (
          <li className="text-ink-muted py-6 text-center text-sm">No reviews yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
