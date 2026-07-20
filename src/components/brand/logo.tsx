import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";

/** Text-only wordmark. Used in the header, footer, auth screens and admin. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-ink text-[1.35rem] leading-none font-semibold tracking-tight",
        className,
      )}
    >
      {brand.nameParts.first}
      <span className="text-teal-600">{brand.nameParts.second}</span>
    </span>
  );
}
