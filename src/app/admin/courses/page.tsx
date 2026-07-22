import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CourseDeleteButton } from "@/components/admin/course-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listCoursesAdmin } from "@/lib/data/admin";
import { formatLkr } from "@/lib/format";

export const metadata: Metadata = { title: "Courses" };

const statusVariant = {
  published: "success",
  draft: "neutral",
  archived: "danger",
} as const;

export default async function AdminCoursesPage() {
  const courses = await listCoursesAdmin();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Courses</h1>
        <Button asChild size="sm">
          <Link href="/admin/courses/new">
            <Plus aria-hidden="true" />
            New course
          </Link>
        </Button>
      </div>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper text-ink-muted text-left text-xs font-semibold tracking-wide uppercase">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-teal-50/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="font-medium text-teal-700 hover:underline"
                  >
                    {course.title}
                  </Link>
                  <div className="text-ink-subtle text-xs">/{course.slug}</div>
                </td>
                <td className="text-ink px-4 py-3">
                  {course.is_free ? "Free" : formatLkr(course.price_cents)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[course.status]} size="sm">
                    {course.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <CourseDeleteButton courseId={course.id} title={course.title} />
                </td>
              </tr>
            ))}
            {courses.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-ink-muted px-4 py-8 text-center">
                  No courses yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
