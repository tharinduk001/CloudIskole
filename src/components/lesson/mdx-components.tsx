import type { MDXComponents } from "mdx/types";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Maps MDX-authored markup onto our design tokens, so a lesson written by an
 * instructor in plain Markdown automatically matches the rest of the product
 * — no per-lesson styling, no drift between lessons.
 */
export const lessonMdxComponents: MDXComponents = {
  h2: (props) => (
    <h2 {...props} className="font-display mt-10 mb-3 text-xl font-semibold first:mt-0" />
  ),
  h3: (props) => (
    <h3 {...props} className="font-display mt-8 mb-2 text-lg font-semibold" />
  ),
  p: (props) => (
    <p {...props} className="text-ink-muted my-4 text-[0.95rem] leading-relaxed" />
  ),
  ul: (props) => (
    <ul
      {...props}
      className="text-ink-muted my-4 flex list-disc flex-col gap-2 pl-6 text-[0.95rem]"
    />
  ),
  ol: (props) => (
    <ol
      {...props}
      className="text-ink-muted my-4 flex list-decimal flex-col gap-2 pl-6 text-[0.95rem]"
    />
  ),
  li: (props) => <li {...props} className="leading-relaxed" />,
  a: ({ href, ...props }) => {
    const isExternal = href?.startsWith("http");
    return isExternal ? (
      <a
        {...props}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-teal-600 underline underline-offset-2 hover:text-teal-700"
      />
    ) : (
      <Link
        href={href ?? "#"}
        className="font-medium text-teal-600 underline underline-offset-2 hover:text-teal-700"
      >
        {props.children}
      </Link>
    );
  },
  blockquote: (props) => (
    <blockquote
      {...props}
      className="text-ink-muted my-5 rounded-r-lg border-l-4 border-teal-200 bg-teal-50/60 py-2 pl-4 text-[0.95rem] italic"
    />
  ),
  hr: (props) => <hr {...props} className="border-line my-8" />,
  strong: (props) => <strong {...props} className="text-ink font-semibold" />,
  table: (props) => (
    <div className="my-5 overflow-x-auto rounded-xl border border-[var(--color-line)]">
      <table {...props} className="w-full border-collapse text-left text-sm" />
    </div>
  ),
  thead: (props) => <thead {...props} className="bg-paper" />,
  th: (props) => (
    <th {...props} className="border-line text-ink border-b px-4 py-2.5 font-semibold" />
  ),
  td: (props) => (
    <td {...props} className="border-line text-ink-muted border-b px-4 py-2.5" />
  ),
  // Inline `code` renders as a chip; fenced code blocks arrive pre-wrapped by
  // rehype-pretty-code as <pre><code>, so this only matches the inline case.
  code: (props) => (
    <code
      {...props}
      className={cn(
        "rounded-md px-1.5 py-0.5 font-mono text-[0.85em]",
        "bg-teal-50 text-teal-800",
      )}
    />
  ),
  // rehype-pretty-code (Shiki) sets its own token colors via inline styles on
  // this element and its children — only background/spacing is styled here so
  // syntax highlighting is not clobbered by a text-color override.
  pre: (props) => (
    <pre
      {...props}
      className="border-line my-5 overflow-x-auto rounded-xl border p-4 text-[0.85rem] leading-relaxed [&_code]:bg-transparent [&_code]:p-0"
    />
  ),
};
