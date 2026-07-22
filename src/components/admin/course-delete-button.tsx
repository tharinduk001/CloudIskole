"use client";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { deleteCourse } from "@/lib/admin/courses-actions";

export function CourseDeleteButton({
  courseId,
  title,
}: {
  courseId: string;
  title: string;
}) {
  return (
    <ConfirmDeleteButton
      label="Delete course"
      confirmMessage={`Delete "${title}"? This cannot be undone.`}
      onDelete={() => deleteCourse(courseId)}
    />
  );
}
