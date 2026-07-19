import type { MetadataRoute } from "next";

import { clientEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = clientEnv.NEXT_PUBLIC_SITE_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Signed-in areas and auth endpoints carry nothing a crawler should
        // index, and indexing them would surface half-rendered shells in
        // search results.
        disallow: ["/dashboard", "/admin", "/my", "/profile", "/auth/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
