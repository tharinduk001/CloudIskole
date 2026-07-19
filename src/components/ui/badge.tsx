import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        neutral: "bg-paper text-ink-muted border-line border",
        teal: "bg-teal-50 text-teal-700 border-teal-100 border",
        // Gold text uses the 700 step: the 400 brand gold fails contrast.
        gold: "bg-gold-50 text-gold-700 border-gold-200 border",
        success: "bg-success-soft text-success border-success/20 border",
        warning: "bg-warning-soft text-warning border-warning/20 border",
        danger: "bg-danger-soft text-danger border-danger/20 border",
        info: "bg-info-soft text-info border-info/20 border",
        solid: "bg-teal-600 text-white",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}
