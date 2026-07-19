"use client";

import { FileText, PlayCircle, Plus } from "lucide-react";
import * as React from "react";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { LessonForm } from "@/components/admin/lesson-form";
import { Badge } from "@/components/ui/badge";
import { deleteLesson, deleteModule } from "@/lib/admin/courses-actions";
import type { AdminModule } from "@/lib/data/admin";

export function ModuleEditor({ courseId, module: mod }: { courseId: string; module: AdminModule }) {
  const [addingLesson, setAddingLesson] = React.useState(false);
  const [editingLessonId, setEditingLessonId] = React.useState<string | null>(null);

  return (
    <div className="border-line bg-surface rounded-2xl border p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-ink text-sm font-semibold">
            {mod.title} <span className="text-ink-subtle font-normal">· sort {mod.sort_order}</span>
          </h3>
          {mod.summary ? <p className="text-ink-muted mt-0.5 text-xs">{mod.summary}</p> : null}
        </div>
        <ConfirmDeleteButton
          label="Delete module"
          confirmMessage={`Delete "${mod.title}" and all its lessons?`}
          onDelete={() => deleteModule(mod.id, courseId)}
        />
      </div>

      <ul className="border-line mt-4 divide-y divide-[var(--color-line)] overflow-hidden rounded-xl border">
        {mod.lessons.map((lesson) => (
          <li key={lesson.id}>
            {editingLessonId === lesson.id ? (
              <div className="p-3">
                <LessonForm
                  courseId={courseId}
                  moduleId={mod.id}
                  lesson={lesson}
                  onDone={() => setEditingLessonId(null)}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">
                {lesson.type === "video" ? (
                  <PlayCircle className="text-ink-subtle size-4 shrink-0" aria-hidden="true" />
                ) : (
                  <FileText className="text-ink-subtle size-4 shrink-0" aria-hidden="true" />
                )}
                <button
                  type="button"
                  onClick={() => setEditingLessonId(lesson.id)}
                  className="flex-1 text-left text-sm font-medium text-teal-700 hover:underline"
                >
                  {lesson.title}
                </button>
                {lesson.is_preview ? (
                  <Badge variant="gold" size="sm">
                    Preview
                  </Badge>
                ) : null}
                <span className="text-ink-subtle text-xs">{lesson.type}</span>
                <ConfirmDeleteButton
                  label="Delete lesson"
                  confirmMessage={`Delete lesson "${lesson.title}"?`}
                  onDelete={() => deleteLesson(lesson.id, courseId)}
                />
              </div>
            )}
          </li>
        ))}
        {mod.lessons.length === 0 ? (
          <li className="text-ink-muted px-4 py-3 text-xs">No lessons yet.</li>
        ) : null}
      </ul>

      <div className="mt-3">
        {addingLesson ? (
          <LessonForm courseId={courseId} moduleId={mod.id} onDone={() => setAddingLesson(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setAddingLesson(true)}
            className="text-ink-muted inline-flex items-center gap-1.5 text-xs font-medium hover:text-teal-700"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add lesson
          </button>
        )}
      </div>
    </div>
  );
}
