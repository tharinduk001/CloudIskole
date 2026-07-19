import * as React from "react";

import { cn } from "@/lib/utils";

/** Horizontal page gutter and max width. Every page section uses this. */
export function Container({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "narrow" | "wide" }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-6 lg:px-8",
        size === "narrow" && "max-w-3xl",
        size === "default" && "max-w-6xl",
        size === "wide" && "max-w-7xl",
        className,
      )}
      {...props}
    />
  );
}

/** Standard vertical rhythm between page sections. */
export function Section({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("py-16 sm:py-20 lg:py-28", className)} {...props} />;
}

/**
 * Section heading block: optional eyebrow, title, and supporting line.
 * Centralised so heading scale and spacing stay identical site-wide.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "mx-auto max-w-2xl text-center",
        className,
      )}
    >
      {eyebrow ? (
        <span className="text-gold-700 text-xs font-semibold tracking-[0.14em] uppercase">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="font-display text-3xl leading-[1.15] sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "text-ink-muted text-base leading-relaxed sm:text-lg",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
