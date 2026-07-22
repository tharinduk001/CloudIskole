"use client";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { deleteQuiz } from "@/lib/admin/quizzes-actions";

export function QuizDeleteButton({ quizId, title }: { quizId: string; title: string }) {
  return (
    <ConfirmDeleteButton
      label="Delete quiz"
      confirmMessage={`Delete "${title}"? This cannot be undone.`}
      onDelete={() => deleteQuiz(quizId)}
    />
  );
}
