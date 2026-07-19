"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/actions/result";
import type { QuizResult } from "@/lib/data/quizzes";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

const startSchema = z.object({ quizId: z.uuid(), returnTo: z.string().trim().min(1) });

/**
 * Opens (or resumes) an attempt and sends the student to the runner.
 *
 * All the real logic — enrollment check, availability window, attempt-limit
 * enforcement, resuming an open attempt instead of burning a new one — lives
 * inside `start_quiz_attempt()` (0005_quizzes.sql). This is a thin front
 * door: a request that skipped this form would hit the same checks.
 */
export async function startQuizAttempt(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = startSchema.safeParse({
    quizId: formData.get("quizId"),
    returnTo: formData.get("returnTo"),
  });
  if (!parsed.success) {
    return { status: "error", message: "That quiz could not be found." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(parsed.data.returnTo)}`);
  }

  const { data: attemptId, error } = await supabase.rpc("start_quiz_attempt", {
    p_quiz_id: parsed.data.quizId,
  });

  if (error || !attemptId) {
    console.error("startQuizAttempt failed", error);
    return {
      status: "error",
      message: error?.message ?? "We could not start this attempt. Please try again.",
    };
  }

  redirect(`/quiz/attempt/${attemptId}`);
}

const submitSchema = z.object({
  attemptId: z.uuid(),
  answers: z.string(), // JSON-encoded { [questionId]: optionId }
});

/**
 * Submits an attempt for server-side grading.
 *
 * The client only ever sends `{questionId: optionId}` pairs — it has never
 * been told which option is correct, and cannot compute or influence a
 * score. `submit_quiz_attempt()` does the grading, against the answer key it
 * alone can read, and returns the result including explanations exactly
 * once the attempt is closed.
 */
export async function submitQuizAttempt(
  attemptId: string,
  answers: Record<string, string>,
) {
  const parsed = submitSchema.safeParse({ attemptId, answers: JSON.stringify(answers) });
  if (!parsed.success) {
    return { status: "error" as const, message: "Something went wrong. Please retry." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const limited = await rateLimit("quiz.submit", user.id, 30, 3600);
    if (!limited.allowed) {
      return {
        status: "error" as const,
        message: "Too many submissions. Please wait a while and try again.",
      };
    }
  }

  const { data, error } = await supabase.rpc("submit_quiz_attempt", {
    p_attempt_id: parsed.data.attemptId,
    p_answers: JSON.parse(parsed.data.answers),
  });

  if (error || !data) {
    console.error("submitQuizAttempt failed", error);
    return {
      status: "error" as const,
      message: error?.message ?? "We could not submit your attempt. Please try again.",
    };
  }

  revalidatePath("/exams");

  return { status: "success" as const, result: data as unknown as QuizResult };
}
