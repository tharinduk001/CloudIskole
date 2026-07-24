"use client";

import { Quote } from "lucide-react";
import * as React from "react";

import type { Testimonial } from "@/lib/data/site-content";
import { cn } from "@/lib/utils";

const ROTATE_MS = 6000;
const FADE_MS = 400;

/**
 * One review at a time, crossfading to the next on a timer — reads better
 * for full sentences than a scrolling strip, which only gives each card a
 * glance. Dots let a visitor jump directly to a review instead of waiting.
 */
export function TestimonialsCarousel({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const [index, setIndex] = React.useState(0);
  const [visible, setVisible] = React.useState(true);
  const fadeTimeoutRef = React.useRef<number | undefined>(undefined);

  const goTo = React.useCallback((next: React.SetStateAction<number>) => {
    setVisible(false);
    fadeTimeoutRef.current = window.setTimeout(() => {
      setIndex(next);
      setVisible(true);
    }, FADE_MS);
  }, []);

  React.useEffect(() => {
    return () => window.clearTimeout(fadeTimeoutRef.current);
  }, []);

  React.useEffect(() => {
    if (testimonials.length <= 1) return;
    const id = window.setInterval(() => {
      goTo((current) => (current + 1) % testimonials.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [testimonials.length, goTo]);

  if (testimonials.length === 0) return null;

  // Checked above: index is always a valid position in a non-empty array.
  const active = testimonials[index]!;

  return (
    <div className="mx-auto max-w-2xl text-center">
      <Quote
        className="text-terracotta-300 mx-auto size-9"
        aria-hidden="true"
        fill="currentColor"
      />

      <div
        className={cn(
          "mt-6 transition-opacity ease-in-out motion-reduce:transition-none",
          visible ? "opacity-100" : "opacity-0",
        )}
        style={{ transitionDuration: `${FADE_MS}ms` }}
        aria-live="polite"
      >
        <blockquote className="font-display text-onyx text-xl leading-relaxed sm:text-2xl">
          &ldquo;{active.quote}&rdquo;
        </blockquote>
        <p className="text-terracotta-600 mt-5 text-sm font-semibold tracking-wide uppercase">
          {active.student_name}
        </p>
      </div>

      {testimonials.length > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-2">
          {testimonials.map((testimonial, i) => (
            <button
              key={testimonial.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show review from ${testimonial.student_name}`}
              aria-current={i === index}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "bg-terracotta-500 w-6" : "bg-hairline w-1.5",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
