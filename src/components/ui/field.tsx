import * as React from "react";

import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-xl border border-line-strong bg-surface text-ink placeholder:text-ink-subtle transition-[border-color,box-shadow] duration-[var(--duration-fast)] focus:border-teal-500 focus:outline-none focus:shadow-[var(--shadow-ring)] disabled:cursor-not-allowed disabled:bg-paper disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:shadow-[0_0_0_3px_rgb(180_35_24/0.12)]";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(controlBase, "h-11 px-4 text-sm", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlBase, "min-h-32 resize-y px-4 py-3 text-sm", className)}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select className={cn(controlBase, "h-11 px-4 text-sm", className)} {...props} />
  );
}

/** Checkbox with its label, sized and spaced for touch. */
export function CheckboxField({
  label,
  description,
  ...props
}: React.ComponentProps<"input"> & { label: string; description?: string }) {
  const id = React.useId();
  return (
    <div className="flex items-start gap-3">
      <input
        {...props}
        id={id}
        type="checkbox"
        className="border-line-strong mt-0.5 size-4.5 shrink-0 rounded accent-teal-600"
      />
      <label htmlFor={id} className="text-sm leading-relaxed">
        <span className="text-ink font-medium">{label}</span>
        {description ? (
          <span className="text-ink-muted block text-xs">{description}</span>
        ) : null}
      </label>
    </div>
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-ink text-sm font-medium", className)} {...props} />;
}

/**
 * Wraps a control with its label, hint and error, wiring up the `id`,
 * `aria-describedby` and `aria-invalid` relationships automatically.
 *
 * Doing this in one place is why the forms are accessible by default: an
 * individual form cannot forget to associate its error text with its input.
 */
export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  /** Validation message. Its presence marks the control invalid. */
  error?: string;
  required?: boolean;
  /** Receives `id`, `aria-describedby` and `aria-invalid`. */
  children: (props: {
    id: string;
    "aria-describedby": string | undefined;
    "aria-invalid": boolean;
  }) => React.ReactNode;
  className?: string;
}) {
  const id = React.useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="text-danger ml-0.5" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>

      {children({ id, "aria-describedby": describedBy, "aria-invalid": Boolean(error) })}

      {hint && !error ? (
        <p id={hintId} className="text-ink-subtle text-xs">
          {hint}
        </p>
      ) : null}

      {error ? (
        // role="alert" so screen readers announce it the moment it appears.
        <p id={errorId} role="alert" className="text-danger text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
