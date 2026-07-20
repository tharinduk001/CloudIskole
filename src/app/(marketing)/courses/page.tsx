import type { Metadata } from "next";
import Link from "next/link";

import { CourseCard } from "@/components/courses/course-card";
import { PageHeader } from "@/components/site/page-header";
import { Badge } from "@/components/ui/badge";
import { Container, Section } from "@/components/ui/layout";
import { cn } from "@/lib/utils";
import { listPublishedCourses } from "@/lib/data/courses";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Cloud, DevOps, Linux and Software Engineering courses built for Sri Lankan students after A/Ls. Free and paid tracks, priced in rupees.",
};

type Filter = "all" | "free" | "paid";

function isFilter(value: string | undefined): value is Filter {
  return value === "free" || value === "paid";
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ price?: string; category?: string }>;
}) {
  const params = await searchParams;
  const priceFilter: Filter = isFilter(params.price) ? params.price : "all";
  const activeCategory = params.category;

  const courses = await listPublishedCourses();

  const categories = Array.from(
    new Set(courses.map((c) => c.category).filter((c): c is string => Boolean(c))),
  ).sort();

  const filtered = courses.filter((c) => {
    if (priceFilter === "free" && !c.is_free) return false;
    if (priceFilter === "paid" && c.is_free) return false;
    if (activeCategory && c.category !== activeCategory) return false;
    return true;
  });

  function filterHref(next: Partial<{ price: string; category: string }>) {
    const merged = { price: params.price, category: params.category, ...next };
    const qs = new URLSearchParams();
    if (merged.price && merged.price !== "all") qs.set("price", merged.price);
    if (merged.category) qs.set("category", merged.category);
    const query = qs.toString();
    return query ? `/courses?${query}` : "/courses";
  }

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Courses"
        description="Free and paid tracks in Cloud, DevOps, Linux and Software Engineering - each one built to take you from zero to job-ready."
      />

      <Section className="py-12 sm:py-16">
        <Container size="wide">
          {courses.length === 0 ? (
            <div className="border-hairline bg-surface rounded-none border px-6 py-16 text-center">
              <h2 className="font-display text-onyx text-xl font-semibold">
                Courses are coming very soon
              </h2>
              <p className="text-mist mx-auto mt-3 max-w-md text-sm leading-relaxed">
                We are putting the finishing touches on the first tracks. Create a free
                account and we will let you know the moment they open.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <FilterPill
                  href={filterHref({ price: "all" })}
                  active={priceFilter === "all"}
                >
                  All courses
                </FilterPill>
                <FilterPill
                  href={filterHref({ price: "free" })}
                  active={priceFilter === "free"}
                >
                  Free
                </FilterPill>
                <FilterPill
                  href={filterHref({ price: "paid" })}
                  active={priceFilter === "paid"}
                >
                  Paid
                </FilterPill>

                {categories.length > 0 ? (
                  <span className="bg-hairline mx-1 h-5 w-px" aria-hidden="true" />
                ) : null}

                {categories.map((category) => (
                  <FilterPill
                    key={category}
                    href={filterHref({
                      category: activeCategory === category ? undefined : category,
                    })}
                    active={activeCategory === category}
                  >
                    {category}
                  </FilterPill>
                ))}
              </div>

              {filtered.length === 0 ? (
                <p className="text-mist mt-12 text-center text-sm">
                  No courses match these filters yet.{" "}
                  <Link
                    href="/courses"
                    className="text-terracotta-600 font-medium hover:underline"
                  >
                    Clear filters
                  </Link>
                  .
                </p>
              ) : (
                <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              )}
            </>
          )}
        </Container>
      </Section>
    </>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} scroll={false}>
      <Badge
        className={cn(
          "cursor-pointer rounded-none border-0 px-3.5 py-1.5 text-[13px] transition-colors",
          active
            ? "bg-onyx text-white"
            : "bg-hairline/50 text-onyx-soft hover:bg-terracotta-50 hover:text-terracotta-600",
        )}
      >
        {children}
      </Badge>
    </Link>
  );
}
