import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listQuizzesAdmin } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Quizzes" };

const statusVariant = {
  published: "success",
  draft: "neutral",
  archived: "danger",
} as const;

const scopeLabel: Record<string, string> = {
  exam: "Standalone exam",
  course: "Course quiz",
  lesson: "Lesson quiz",
};

export default async function AdminQuizzesPage() {
  const quizzes = await listQuizzesAdmin();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Quizzes</h1>
        <Button asChild size="sm">
          <Link href="/admin/quizzes/new">
            <Plus aria-hidden="true" />
            New quiz
          </Link>
        </Button>
      </div>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper text-ink-muted text-left text-xs font-semibold uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {quizzes.map((quiz) => (
              <tr key={quiz.id} className="hover:bg-teal-50/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/quizzes/${quiz.id}`}
                    className="font-medium text-teal-700 hover:underline"
                  >
                    {quiz.title}
                  </Link>
                  <div className="text-ink-subtle text-xs">/{quiz.slug}</div>
                </td>
                <td className="px-4 py-3 text-ink">{scopeLabel[quiz.scope] ?? quiz.scope}</td>
                <td className="text-ink-muted px-4 py-3">
                  {(quiz.course as { title: string } | null)?.title ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[quiz.status]} size="sm">
                    {quiz.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {quizzes.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-ink-muted px-4 py-8 text-center">
                  No quizzes yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
