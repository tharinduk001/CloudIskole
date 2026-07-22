import type { Highlight } from "@/lib/data/site-content";

/**
 * Subtle alternating tilt per tile keeps the collage from feeling too rigid
 * while staying readable — a "collage" feel rather than true randomness.
 */
const TILTS = ["-rotate-1", "rotate-1", "rotate-0", "rotate-1", "-rotate-1", "rotate-0"];

/**
 * CSS multi-column masonry, not a grid: each photo keeps its own natural
 * aspect ratio (no cropping to a fixed cell), and the browser packs items
 * into the shortest column as it goes - so a plain <img> is used rather
 * than next/image, since there is no single width/height to declare for
 * photos of mixed orientation from an external, admin-curated source.
 */
export function PhotoGrid({ photos }: { photos: Highlight[] }) {
  if (photos.length === 0) return null;

  return (
    <div className="columns-2 gap-4 [column-fill:_balance] sm:columns-3">
      {photos.map((photo, i) => (
        <div
          key={photo.id}
          className={`border-hairline group relative mb-4 break-inside-avoid overflow-hidden rounded-xl border transition-transform duration-300 hover:z-10 hover:scale-[1.03] ${TILTS[i % TILTS.length]}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- mixed-orientation external photos, no fixed aspect ratio to declare */}
          <img src={photo.src} alt={photo.alt} className="h-auto w-full object-cover" />
        </div>
      ))}
    </div>
  );
}
