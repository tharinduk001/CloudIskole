import * as React from "react";

import { slugify } from "@/lib/slug";

/**
 * Derives a slug from a title as the admin types, until they edit the slug
 * field by hand — at which point it stops following the title. Starts
 * already-touched when an existing slug is passed in, so editing a saved
 * item's title never rewrites (and breaks) its URL.
 */
export function useAutoSlug(initialSlug?: string) {
  const [slug, setSlug] = React.useState(initialSlug ?? "");
  const touched = React.useRef(Boolean(initialSlug));

  return {
    slug,
    onTitleChange: (title: string) => {
      if (!touched.current) setSlug(slugify(title));
    },
    onSlugChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      touched.current = true;
      setSlug(e.target.value);
    },
  };
}
