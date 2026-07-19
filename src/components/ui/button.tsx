import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base: every button shares the same focus ring, disabled treatment and
  // motion curve, so interaction feels identical across the product.
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-[var(--duration-base)] ease-[var(--ease-out-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Primary call to action. One per view, ideally. */
        primary:
          "bg-teal-600 text-white shadow-xs hover:bg-teal-700 active:bg-teal-800",
        /** Secondary action sitting beside a primary. */
        secondary:
          "border border-line-strong bg-surface text-ink shadow-xs hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700",
        /** High-emphasis accent — used sparingly, e.g. "Enroll free". */
        accent: "bg-gold-400 text-teal-900 shadow-xs hover:bg-gold-300 active:bg-gold-500",
        /** Low-emphasis action inside dense UI. */
        ghost: "text-ink-muted hover:bg-teal-50 hover:text-teal-700",
        /** Destructive action: delete, reject, cancel enrollment. */
        danger: "bg-danger text-white shadow-xs hover:brightness-110",
        /** Inline text action that reads as a link. */
        link: "text-teal-600 underline-offset-4 hover:text-teal-700 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-sm [&_svg]:size-4",
        md: "h-11 px-5 text-sm [&_svg]:size-4",
        lg: "h-13 px-7 text-base [&_svg]:size-5",
        /** Square icon-only button. Always pair with an aria-label. */
        icon: "size-10 [&_svg]:size-5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  /**
   * Render as the child element instead of a `<button>`, keeping the styles.
   * Use for links that should look like buttons:
   * `<Button asChild><Link href="/courses">Browse</Link></Button>`
   */
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

export { buttonVariants };
