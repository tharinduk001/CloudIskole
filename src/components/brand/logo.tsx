import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";

/**
 * The mark: a cloud carrying an upward deploy arrow — cloud infrastructure
 * plus forward motion, which is the whole promise of the platform in one
 * glyph. Gold arrow on white reads clearly at 20px, unlike gold on teal.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-label={`${brand.name} logo`}
      className={cn("size-9", className)}
    >
      <rect width="40" height="40" rx="11" className="fill-teal-600" />
      <g className="fill-white">
        <circle cx="15.5" cy="23" r="4.8" />
        <circle cx="24.5" cy="21.5" r="6.2" />
        <rect x="13" y="22.6" width="14" height="5.4" rx="2.7" />
      </g>
      <path
        d="M20 25.4V16.8m-3.1 3.1L20 16.8l3.1 3.1"
        className="stroke-gold-400"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** Mark plus wordmark. Used in the header, footer and auth screens. */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {showWordmark ? (
        <span className="font-display text-ink text-[1.35rem] leading-none font-semibold tracking-tight">
          {brand.nameParts.first}
          <span className="text-teal-600">{brand.nameParts.second}</span>
        </span>
      ) : null}
    </span>
  );
}
