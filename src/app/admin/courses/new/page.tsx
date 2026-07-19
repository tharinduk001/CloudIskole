import type { Metadata } from "next";

import { CourseForm } from "@/components/admin/course-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "New course" };

export default function NewCoursePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold">New course</h1>
      <Card className="mt-6 p-6">
        <CourseForm />
      </Card>
    </div>
  );
}
