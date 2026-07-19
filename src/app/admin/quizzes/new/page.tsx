import type { Metadata } from "next";

import { QuizForm } from "@/components/admin/quiz-form";
import { Card } from "@/components/ui/card";
import { listCoursesAdmin } from "@/lib/data/admin";

export const metadata: Metadata = { title: "New quiz" };

export default async function NewQuizPage() {
  const courses = await listCoursesAdmin();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold">New quiz</h1>
      <Card className="mt-6 p-6">
        <QuizForm courses={courses.map((c) => ({ id: c.id, title: c.title }))} />
      </Card>
    </div>
  );
}
