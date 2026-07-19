"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { ActionResult } from "@/lib/actions/result";
import { requireAdmin } from "@/lib/data/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Quiz, question and option mutations for the admin builder.
 *
 * Same trust model as the course builder: these run as the signed-in admin
 * through the regular server client, relying on the "admin full access" RLS
 * policies already on `quizzes`/`quiz_questions`/`quiz_options`
 * (0005_quizzes.sql) as the actual gate. `quiz_options` is the one table in
 * this codebase that must NEVER get a student-readable policy — nothing
 * here touches that; it only adds admin-side writes on top of it.
 */

const quizSchema = z.object({
  id: z.uuid().optional(),
  scope: z.enum(["lesson", "course", "exam"]),
  courseId: z.uuid().optional(),
  lessonId: z.uuid().optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only."),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(2000).optional(),
  timeLimitMinutes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
  passMarkPct: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : 60)),
  maxAttempts: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
  shuffleQuestions: z.union([z.literal("on"), z.null()]).optional(),
  shuffleOptions: z.union([z.literal("on"), z.null()]).optional(),
});

export async function upsertQuiz(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const scope = formData.get("scope");
  const parsed = quizSchema.safeParse({
    id: formData.get("id") || undefined,
    scope,
    courseId: formData.get("courseId") || undefined,
    lessonId: formData.get("lessonId") || undefined,
    slug: formData.get("slug"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    timeLimitMinutes: formData.get("timeLimitMinutes") || undefined,
    passMarkPct: formData.get("passMarkPct") || undefined,
    maxAttempts: formData.get("maxAttempts") || undefined,
    shuffleQuestions: formData.get("shuffleQuestions"),
    shuffleOptions: formData.get("shuffleOptions"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields." };
  }

  if (parsed.data.scope !== "exam" && !parsed.data.courseId) {
    return {
      status: "error",
      message: "A course-scoped or lesson-scoped quiz needs a course.",
    };
  }
  if (parsed.data.scope === "lesson" && !parsed.data.lessonId) {
    return { status: "error", message: "A lesson-scoped quiz needs a lesson id." };
  }

  const supabase = await createClient();
  const row = {
    scope: parsed.data.scope,
    course_id: parsed.data.scope === "exam" ? null : (parsed.data.courseId ?? null),
    lesson_id: parsed.data.scope === "lesson" ? (parsed.data.lessonId ?? null) : null,
    slug: parsed.data.slug,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    time_limit_minutes: parsed.data.timeLimitMinutes ?? null,
    pass_mark_pct: parsed.data.passMarkPct,
    max_attempts: parsed.data.maxAttempts ?? null,
    shuffle_questions: parsed.data.shuffleQuestions === "on",
    shuffle_options: parsed.data.shuffleOptions === "on",
  };

  if (parsed.data.id) {
    const { error } = await supabase.from("quizzes").update(row).eq("id", parsed.data.id);
    if (error) {
      console.error("upsertQuiz update failed", error);
      return { status: "error", message: "Could not save this quiz." };
    }
    revalidatePath(`/admin/quizzes/${parsed.data.id}`);
    revalidatePath("/admin/quizzes");
    return { status: "success", message: "Quiz saved." };
  }

  const { data: created, error } = await supabase
    .from("quizzes")
    .insert(row)
    .select("id")
    .single();
  if (error || !created) {
    console.error("upsertQuiz insert failed", error);
    return {
      status: "error",
      message:
        error?.code === "23505"
          ? "That slug is already in use."
          : "Could not create this quiz.",
    };
  }

  revalidatePath("/admin/quizzes");
  redirect(`/admin/quizzes/${created.id}`);
}

export async function setQuizStatus(
  quizId: string,
  status: "draft" | "published" | "archived",
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("quizzes").update({ status }).eq("id", quizId);
  if (error) {
    console.error("setQuizStatus failed", error);
    return { status: "error", message: "Could not update the quiz status." };
  }

  revalidatePath(`/admin/quizzes/${quizId}`);
  revalidatePath("/admin/quizzes");
  return { status: "success" };
}

const questionSchema = z.object({
  id: z.uuid().optional(),
  quizId: z.uuid(),
  body: z.string().trim().min(3).max(2000),
  explanation: z.string().trim().max(2000).optional(),
  points: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : 1)),
  sortOrder: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : 0)),
});

export async function upsertQuestion(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = questionSchema.safeParse({
    id: formData.get("id") || undefined,
    quizId: formData.get("quizId"),
    body: formData.get("body"),
    explanation: formData.get("explanation") || undefined,
    points: formData.get("points") || undefined,
    sortOrder: formData.get("sortOrder") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields." };
  }

  const supabase = await createClient();
  const row = {
    quiz_id: parsed.data.quizId,
    body: parsed.data.body,
    explanation: parsed.data.explanation ?? null,
    points: parsed.data.points,
    sort_order: parsed.data.sortOrder,
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("quiz_questions")
      .update(row)
      .eq("id", parsed.data.id);
    if (error) {
      console.error("upsertQuestion update failed", error);
      return { status: "error", message: "Could not save this question." };
    }
  } else {
    const { error } = await supabase.from("quiz_questions").insert(row);
    if (error) {
      console.error("upsertQuestion insert failed", error);
      return { status: "error", message: "Could not create this question." };
    }
  }

  revalidatePath(`/admin/quizzes/${parsed.data.quizId}`);
  return { status: "success", message: "Question saved." };
}

export async function deleteQuestion(
  questionId: string,
  quizId: string,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("quiz_questions").delete().eq("id", questionId);
  if (error) {
    console.error("deleteQuestion failed", error);
    return { status: "error", message: "Could not delete this question." };
  }
  revalidatePath(`/admin/quizzes/${quizId}`);
  return { status: "success" };
}

const optionSchema = z.object({
  id: z.uuid().optional(),
  questionId: z.uuid(),
  quizId: z.uuid(),
  body: z.string().trim().min(1).max(500),
  isCorrect: z.union([z.literal("on"), z.null()]).optional(),
  sortOrder: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : 0)),
});

/**
 * Saves an option. When marked correct, every sibling option under the same
 * question is unmarked first — single-answer MCQs only, so "correct" is
 * exclusive by construction rather than left for the grader to assume.
 */
export async function upsertOption(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = optionSchema.safeParse({
    id: formData.get("id") || undefined,
    questionId: formData.get("questionId"),
    quizId: formData.get("quizId"),
    body: formData.get("body"),
    isCorrect: formData.get("isCorrect"),
    sortOrder: formData.get("sortOrder") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields." };
  }

  const supabase = await createClient();
  const isCorrect = parsed.data.isCorrect === "on";

  if (isCorrect) {
    const { error: clearError } = await supabase
      .from("quiz_options")
      .update({ is_correct: false })
      .eq("question_id", parsed.data.questionId);
    if (clearError) {
      console.error("upsertOption clear failed", clearError);
      return { status: "error", message: "Could not save this option." };
    }
  }

  const row = {
    question_id: parsed.data.questionId,
    body: parsed.data.body,
    is_correct: isCorrect,
    sort_order: parsed.data.sortOrder,
  };

  const { error } = parsed.data.id
    ? await supabase.from("quiz_options").update(row).eq("id", parsed.data.id)
    : await supabase.from("quiz_options").insert(row);

  if (error) {
    console.error("upsertOption failed", error);
    return { status: "error", message: "Could not save this option." };
  }

  revalidatePath(`/admin/quizzes/${parsed.data.quizId}`);
  return { status: "success", message: "Option saved." };
}

export async function deleteOption(
  optionId: string,
  quizId: string,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("quiz_options").delete().eq("id", optionId);
  if (error) {
    console.error("deleteOption failed", error);
    return { status: "error", message: "Could not delete this option." };
  }
  revalidatePath(`/admin/quizzes/${quizId}`);
  return { status: "success" };
}
