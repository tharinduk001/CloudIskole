import { GraduationCap } from "lucide-react";

import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";

/** Plain-text wordmark with a cap glyph, in the brand's terracotta tone. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-terracotta-600 font-display inline-flex items-center gap-1.5 text-[1.35rem] leading-none font-semibold tracking-tight",
        className,
      )}
    >
      <GraduationCap className="size-[1.15em]" aria-hidden="true" />
      {brand.name}
    </span>
  );
}
