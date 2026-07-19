import type { Metadata } from "next";

import { CourseForm } from "@/components/admin/course-form";
import { ModuleEditor } from "@/components/admin/module-editor";
import { ModuleForm } from "@/components/admin/module-form";
import { PublishControls } from "@/components/admin/publish-controls";
import { Card } from "@/components/ui/card";
import { getCourseForAdmin } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Edit course" };

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { course, modules } = await getCourseForAdmin(courseId);

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold">{course.title}</h1>
        <PublishControls courseId={course.id} status={course.status} />
      </div>

      <Card className="mt-6 p-6">
        <CourseForm course={course} />
      </Card>

      <h2 className="font-display mt-10 text-lg font-semibold">Course content</h2>
      <div className="mt-4 flex flex-col gap-5">
        {modules.map((mod) => (
          <ModuleEditor key={mod.id} courseId={course.id} module={mod} />
        ))}
        <ModuleForm courseId={course.id} />
      </div>
    </div>
  );
}
