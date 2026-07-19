import { cn } from "@/lib/utils";

/**
 * Liyawel — the curling vine motif carved into Kandyan woodwork and painted
 * on temple walls. Rendered as a hairline at very low opacity, it gives
 * sections a quietly Sri Lankan texture without resorting to flags, elephants
 * or other literal signifiers.
 *
 * Purely decorative, so it is hidden from assistive technology.
 */
export function Liyawel({
  className,
  strokeClassName = "stroke-teal-600",
}: {
  className?: string;
  strokeClassName?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("pointer-events-none select-none", className)}
    >
      <g
        className={strokeClassName}
        strokeWidth="1.1"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      >
        {/* Primary spiral: the vine's main curl. */}
        <path d="M100 190C100 140 60 130 60 100c0-22 18-40 40-40s40 18 40 40c0 18-14 32-32 32-14 0-26-11-26-25 0-11 9-20 20-20s19 8 19 18c0 8-6 14-14 14s-13-6-13-12" />
        {/* Leaves budding off the stem, alternating sides. */}
        <path d="M100 168c-16-2-26-12-27-27 16 1 26 12 27 27Z" />
        <path d="M100 168c16-2 26-12 27-27-16 1-26 12-27 27Z" />
        <path d="M79 118c-13-4-20-14-19-27 13 4 20 14 19 27Z" />
        <path d="M139 106c12-5 18-16 16-29-12 6-18 16-16 29Z" />
        {/* Outer tendrils. */}
        <path d="M60 100c-14-6-22-20-20-36" />
        <path d="M140 100c14-6 22-20 20-36" />
      </g>
    </svg>
  );
}
