"use client";

import { Star } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/** Read-only stars for an average rating (rounded to the nearest whole star). */
export function StarRating({
  rating,
  size = "md",
  className,
}: {
  rating: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const iconSize = size === "sm" ? "size-3.5" : "size-4.5";
  const rounded = Math.round(rating);

  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            iconSize,
            star <= rounded
              ? "fill-gold-400 text-gold-400"
              : "text-hairline fill-transparent",
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/** Clickable 1-5 star picker. Submits `name` as the chosen rating (1-5). */
export function StarRatingInput({
  name,
  defaultValue = 0,
}: {
  name: string;
  defaultValue?: number;
}) {
  const [rating, setRating] = React.useState(defaultValue);
  const [hovered, setHovered] = React.useState(0);
  const shown = hovered || rating;

  return (
    <div className="inline-flex items-center gap-1">
      <input type="hidden" name={name} value={rating} />
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          onClick={() => setRating(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5"
        >
          <Star
            className={cn(
              "size-6",
              star <= shown
                ? "fill-gold-400 text-gold-400"
                : "text-hairline fill-transparent",
            )}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}
