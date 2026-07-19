import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Surface container. Hierarchy comes from a hairline border on the warm paper
 * base rather than a drop shadow — shadows are reserved for genuine layering.
 */
export function Card({
  className,
  interactive = false,
  ...props
}: React.ComponentProps<"div"> & {
  /** Adds hover lift. Only for cards that are themselves a link or button. */
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-line bg-surface rounded-2xl border",
        interactive &&
          "transition-[box-shadow,border-color,transform] duration-[var(--duration-base)] ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("font-display text-lg leading-snug font-semibold", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-ink-muted text-sm leading-relaxed", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-3 p-6 pt-0", className)} {...props} />;
}
