import type { Metadata } from "next";

import { PublishControls } from "@/components/admin/publish-controls";
import { QuestionEditor } from "@/components/admin/question-editor";
import { QuestionForm } from "@/components/admin/question-form";
import { QuizForm } from "@/components/admin/quiz-form";
import { Card } from "@/components/ui/card";
import { setQuizStatus } from "@/lib/admin/quizzes-actions";
import { getQuizForAdmin, listCoursesAdmin } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Edit quiz" };

export default async function AdminQuizDetailPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const [{ quiz, questions }, courses] = await Promise.all([
    getQuizForAdmin(quizId),
    listCoursesAdmin(),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold">{quiz.title}</h1>
        <PublishControls
          status={quiz.status}
          onChange={setQuizStatus.bind(null, quiz.id)}
        />
      </div>

      <Card className="mt-6 p-6">
        <QuizForm
          quiz={quiz}
          courses={courses.map((c) => ({ id: c.id, title: c.title }))}
        />
      </Card>

      <h2 className="font-display mt-10 text-lg font-semibold">Questions</h2>
      <div className="mt-4 flex flex-col gap-5">
        {questions.map((question, i) => (
          <QuestionEditor
            key={question.id}
            quizId={quiz.id}
            question={question}
            index={i}
          />
        ))}
        <QuestionForm quizId={quiz.id} />
      </div>
    </div>
  );
}
