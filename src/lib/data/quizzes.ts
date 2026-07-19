import "server-only";

import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
export type QuizAttemptRow = Database["public"]["Tables"]["quiz_attempts"]["Row"];

/** Shape of `get_quiz_paper()`'s JSON — deliberately has no `is_correct` anywhere. */
export type QuizPaper = {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    time_limit_minutes: number | null;
    pass_mark_pct: number;
  };
  questions: {
    id: string;
    body: string;
    points: number;
    options: { id: string; body: string }[];
  }[];
};

/** Shape of `submit_quiz_attempt()`'s JSON — the answer key, revealed once. */
export type QuizResult = {
  score_points: number;
  total_points: number;
  score_pct: number;
  passed: boolean;
  pass_mark_pct: number;
  questions: {
    id: string;
    body: string;
    explanation: string | null;
    chosen_option_id: string | null;
    correct_option_id: string | null;
    is_correct: boolean | null;
  }[];
};

/** Standalone exams — published, scope `exam` — newest first. */
export async function listExams(): Promise<QuizRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("scope", "exam")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load exams: ${error.message}`);
  return data;
}

/** Published course-scoped quizzes for a course, in a stable order. */
export async function listQuizzesForCourse(courseId: string): Promise<QuizRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("scope", "course")
    .eq("course_id", courseId)
    .eq("status", "published")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load course quizzes: ${error.message}`);
  return data;
}

/** A quiz's own metadata (not the paper — that requires the RPC). RLS-gated by enrollment. */
export async function getQuizBySlug(slug: string): Promise<QuizRow> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("quizzes").select("*").eq("slug", slug).maybeSingle();

  if (error || !data) notFound();
  return data;
}

export async function getQuizById(quizId: string): Promise<QuizRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("quizzes").select("*").eq("id", quizId).maybeSingle();
  return data;
}

/**
 * The quiz paper — questions and options, no answer key — via
 * `get_quiz_paper()`. Throws if the caller isn't allowed to see it (not
 * enrolled, quiz not open yet, etc); the RPC's error message is safe to
 * surface, it never mentions the key.
 */
export async function getQuizPaper(quizId: string): Promise<QuizPaper> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_quiz_paper", { p_quiz_id: quizId });

  if (error || !data) {
    throw new Error(error?.message ?? "This quiz is not available.");
  }

  return data as unknown as QuizPaper;
}

/** The graded review of an already-submitted attempt, via `get_attempt_result()`. */
export async function getAttemptResult(attemptId: string): Promise<QuizResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_attempt_result", { p_attempt_id: attemptId });

  if (error || !data) {
    throw new Error(error?.message ?? "This attempt could not be found.");
  }

  return data as unknown as QuizResult;
}

/** The signed-in student's own attempts at a quiz, most recent first. */
export async function listMyAttempts(quizId: string): Promise<QuizAttemptRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", quizId)
    .eq("user_id", user.id)
    .order("attempt_no", { ascending: false });

  if (error) throw new Error(`Failed to load attempts: ${error.message}`);
  return data;
}

export async function getAttempt(attemptId: string): Promise<QuizAttemptRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("id", attemptId)
    .maybeSingle();

  if (error || !data) notFound();
  return data;
}

/** The graded answers for an already-submitted attempt (RLS: owner, post-submission only). */
export async function getAttemptAnswers(attemptId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quiz_attempt_answers")
    .select("*, question:quiz_questions(body, explanation, sort_order)")
    .eq("attempt_id", attemptId);

  if (error) throw new Error(`Failed to load attempt answers: ${error.message}`);
  return data;
}
