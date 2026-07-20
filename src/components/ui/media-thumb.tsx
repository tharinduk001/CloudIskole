import { ImageOff } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Card cover image with a graceful placeholder when no URL has been set yet
 * (courses/sessions ship without one until an admin pastes a Cloudinary
 * link in). Keeps every listing card the same height whether or not an
 * image exists, rather than the layout jumping around per-card.
 */
export function MediaThumb({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-terracotta-50 relative aspect-video w-full shrink-0 overflow-hidden",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      ) : (
        <div
          className="text-terracotta-400/50 flex h-full w-full items-center justify-center"
          aria-hidden="true"
        >
          <ImageOff className="size-8" />
        </div>
      )}
    </div>
  );
}
