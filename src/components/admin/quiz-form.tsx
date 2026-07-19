"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { CheckboxField, Field, Input, Select, Textarea } from "@/components/ui/field";
import { idleResult } from "@/lib/actions/result";
import { upsertQuiz } from "@/lib/admin/quizzes-actions";
import type { QuizRow } from "@/lib/data/quizzes";

export function QuizForm({
  quiz,
  courses,
}: {
  quiz?: QuizRow;
  courses: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState(upsertQuiz, idleResult);
  const [scope, setScope] = React.useState<QuizRow["scope"]>(quiz?.scope ?? "exam");

  return (
    <form action={action} className="flex flex-col gap-6">
      {quiz ? <input type="hidden" name="id" value={quiz.id} /> : null}

      {state.status === "error" ? (
        <p
          role="alert"
          className="border-danger/20 bg-danger-soft text-danger rounded-xl border px-4 py-3 text-sm"
        >
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p className="border-success/20 bg-success-soft text-success rounded-xl border px-4 py-3 text-sm">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Title" required>
          {(props) => (
            <Input {...props} name="title" required defaultValue={quiz?.title} />
          )}
        </Field>
        <Field label="Slug" required hint="Used in the URL for standalone exams">
          {(props) => <Input {...props} name="slug" required defaultValue={quiz?.slug} />}
        </Field>
      </div>

      <Field label="Description">
        {(props) => (
          <Textarea
            {...props}
            name="description"
            rows={3}
            defaultValue={quiz?.description ?? ""}
          />
        )}
      </Field>

      <Field
        label="Scope"
        required
        hint="Exam: standalone, on /exams. Course: attached to a course page. Lesson: attached to one lesson."
      >
        {(props) => (
          <Select
            {...props}
            name="scope"
            value={scope}
            onChange={(e) => setScope(e.target.value as QuizRow["scope"])}
          >
            <option value="exam">Standalone exam</option>
            <option value="course">Course quiz</option>
            <option value="lesson">Lesson quiz</option>
          </Select>
        )}
      </Field>

      {scope !== "exam" ? (
        <Field label="Course" required>
          {(props) => (
            <Select
              {...props}
              name="courseId"
              required
              defaultValue={quiz?.course_id ?? ""}
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          )}
        </Field>
      ) : null}

      {scope === "lesson" ? (
        <Field
          label="Lesson id"
          required
          hint="Copy the lesson's id from the course builder."
        >
          {(props) => (
            <Input
              {...props}
              name="lessonId"
              required
              defaultValue={quiz?.lesson_id ?? ""}
            />
          )}
        </Field>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Time limit (minutes)" hint="Blank = untimed">
          {(props) => (
            <Input
              {...props}
              name="timeLimitMinutes"
              type="number"
              defaultValue={quiz?.time_limit_minutes ?? ""}
            />
          )}
        </Field>
        <Field label="Pass mark (%)" required>
          {(props) => (
            <Input
              {...props}
              name="passMarkPct"
              type="number"
              required
              defaultValue={quiz?.pass_mark_pct ?? 60}
            />
          )}
        </Field>
        <Field label="Max attempts" hint="Blank = unlimited">
          {(props) => (
            <Input
              {...props}
              name="maxAttempts"
              type="number"
              defaultValue={quiz?.max_attempts ?? ""}
            />
          )}
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        <CheckboxField
          name="shuffleQuestions"
          label="Shuffle question order"
          defaultChecked={quiz?.shuffle_questions ?? true}
        />
        <CheckboxField
          name="shuffleOptions"
          label="Shuffle option order"
          defaultChecked={quiz?.shuffle_options ?? true}
        />
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        {quiz ? "Save quiz" : "Create quiz"}
      </Button>
    </form>
  );
}
