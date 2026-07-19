import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";

import { lessonMdxComponents } from "./mdx-components";

/**
 * Renders instructor-authored MDX stored as text in `lessons.content_mdx`.
 *
 * next-mdx-remote/rsc compiles on the server per request — there is no build
 * step tying lesson content to a deploy, so an admin can publish a new lesson
 * without a redeploy once the Phase 3 admin editor lands.
 *
 * `theme: "one-dark-pro"` is chosen to read well against our light lesson
 * page: code blocks become a deliberate dark panel, which also reads as
 * "this is a terminal/code region" — useful signal in DevOps material that
 * mixes shell commands with prose.
 */
export function LessonMarkdown({ content }: { content: string }) {
  return (
    <div className="measure">
      <MDXRemote
        source={content}
        components={lessonMdxComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [[rehypePrettyCode, { theme: "one-dark-pro" }]],
          },
        }}
      />
    </div>
  );
}
