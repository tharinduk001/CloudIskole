"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Underline tab strip for grouping subsections within one admin page — a
 * horizontal pattern rather than the app's vertical admin sidebar, so the
 * two levels of navigation stay visually distinct instead of nesting two
 * sidebars. Used by the site-content and audit pages.
 */
export function AdminTabs({
  sections,
}: {
  sections: { id: string; label: string; content: React.ReactNode }[];
}) {
  const [active, setActive] = React.useState(sections[0]?.id);

  const activeSection = sections.find((s) => s.id === active) ?? sections[0];

  return (
    <div>
      <div className="border-line overflow-x-auto border-b">
        <div className="flex min-w-max gap-1">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActive(section.id)}
              aria-current={section.id === activeSection?.id ? "true" : undefined}
              className={cn(
                "border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                section.id === activeSection?.id
                  ? "border-teal-600 text-teal-700"
                  : "text-ink-muted hover:text-ink border-transparent",
              )}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">{activeSection?.content}</div>
    </div>
  );
}
