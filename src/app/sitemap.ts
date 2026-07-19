import type { MetadataRoute } from "next";

import { clientEnv } from "@/lib/env";
import { listPublishedCourses } from "@/lib/data/courses";
import { createStaticClient } from "@/lib/supabase/static";

/** Static routes. Session and exam pages join this list in later phases. */
const routes: {
  path: string;
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
}[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/courses", priority: 0.9, changeFrequency: "daily" },
  { path: "/sessions", priority: 0.8, changeFrequency: "daily" },
  { path: "/exams", priority: 0.7, changeFrequency: "weekly" },
  { path: "/leaderboard", priority: 0.5, changeFrequency: "daily" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/refunds", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = clientEnv.NEXT_PUBLIC_SITE_URL;
  const lastModified = new Date();

  const staticEntries = routes.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));

  // Failure here must not take the whole sitemap down — an anonymous crawler
  // request has no session, so this hits the same public RLS policy as any
  // other visitor and only ever returns published courses. Uses the static
  // (cookie-less) client deliberately: the request-scoped one calls
  // `cookies()`, which would force this whole route to render dynamically on
  // every crawl instead of being generated once and cached.
  let courseEntries: MetadataRoute.Sitemap = [];
  try {
    const courses = await listPublishedCourses(createStaticClient());
    courseEntries = courses.map((course) => ({
      url: `${base}/courses/${course.slug}`,
      lastModified: new Date(course.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("sitemap: failed to load courses", error);
  }

  return [...staticEntries, ...courseEntries];
}
