import Image from "next/image";

import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";

/**
 * Image wordmark (icon + "Cloud ඉස්කෝලේ"). Used in the header, footer, auth
 * screens and admin. The source PNG has a transparent background, so it
 * reads correctly against any light surface; on dark surfaces (the footer)
 * pass a `brightness-0 invert` className to render it as a white silhouette
 * instead — the logo's navy "Cloud" text has no contrast against a dark
 * background otherwise.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/logo-wordmark.png"
      alt={brand.name}
      width={1254}
      height={705}
      className={cn("h-10 w-auto", className)}
    />
  );
}
