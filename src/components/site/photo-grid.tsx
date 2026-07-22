import Image from "next/image";

import { momentPhotos } from "@/content/home";

/**
 * Five photos exactly fill both breakpoints' cell count: mobile is a 2x4
 * grid (8 cells) and desktop is a 4x2 grid (8 cells); the first photo's
 * 2x2 span accounts for 4 of those cells at both sizes, leaving the
 * remaining four photos as single cells. Add a photo only alongside a
 * matching change to this span map.
 */
const SPANS = ["col-span-2 row-span-2", "", "", "", ""];

export function PhotoGrid() {
  return (
    <div className="grid h-[520px] grid-cols-2 grid-rows-4 gap-3 sm:h-[340px] sm:grid-cols-4 sm:grid-rows-2 md:h-[400px]">
      {momentPhotos.map((photo, i) => (
        <div
          key={photo.src}
          className={`border-hairline relative overflow-hidden border ${SPANS[i] ?? ""}`}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 640px) 25vw, 50vw"
            className="object-cover transition-transform duration-[var(--duration-base)] hover:scale-105"
          />
        </div>
      ))}
    </div>
  );
}
