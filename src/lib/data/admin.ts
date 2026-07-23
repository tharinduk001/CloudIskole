import "server-only";

import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type AdminOrderRow = Database["public"]["Tables"]["orders"]["Row"] & {
  course: { title: string; slug: string };
  student: { full_name: string; email: string };
  bank_transfer: Database["public"]["Tables"]["bank_transfers"]["Row"] | null;
};

/**
 * Orders awaiting a decision, oldest first — the admin review queue.
 *
 * Reads as the signed-in admin via plain RLS ("orders: admin full access"),
 * not the service-role client: viewing the queue is not a privileged
 * mutation, so there's no reason to bypass RLS just to look at it.
 */
export async function listOrdersForReview(): Promise<AdminOrderRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, course:courses(title, slug), student:profiles!orders_user_id_fkey(full_name, email), bank_transfer:bank_transfers(*)",
    )
    .in("status", ["under_review", "pending"])
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load review queue: ${error.message}`);
  return data as unknown as AdminOrderRow[];
}

type OrderStatus = Database["public"]["Enums"]["order_status"];

/** Every order, most recent first — for the general orders list, optionally filtered. */
export async function listAllOrders(filters?: {
  status?: OrderStatus;
  from?: string;
  to?: string;
}): Promise<AdminOrderRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select(
      "*, course:courses(title, slug), student:profiles!orders_user_id_fkey(full_name, email), bank_transfer:bank_transfers(*)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.from) query = query.gte("created_at", filters.from);
  if (filters?.to) query = query.lte("created_at", filters.to);

  const { data, error } = await query;

  if (error) throw new Error(`Failed to load orders: ${error.message}`);
  return data as unknown as AdminOrderRow[];
}

export async function getOrderForAdmin(orderId: string): Promise<AdminOrderRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, course:courses(title, slug), student:profiles!orders_user_id_fkey(full_name, email), bank_transfer:bank_transfers(*)",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) notFound();
  return data as unknown as AdminOrderRow;
}

export type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];
export type PaymentEventRow = Database["public"]["Tables"]["payment_events"]["Row"] & {
  order: { reference_code: string } | null;
};

export async function listAuditLogs(limit = 100): Promise<AuditLogRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load audit log: ${error.message}`);
  return data;
}

export async function listPaymentEvents(limit = 100): Promise<PaymentEventRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_events")
    .select("*, order:orders(reference_code)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load payment events: ${error.message}`);
  return data as unknown as PaymentEventRow[];
}

/** Every course regardless of status — the admin catalogue view. */
export async function listCoursesAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to load courses: ${error.message}`);
  return data;
}

export type AdminReviewRow = Database["public"]["Tables"]["course_reviews"]["Row"] & {
  course: { title: string };
  reviewer: { full_name: string; email: string };
};

/** Every review regardless of status, pending first then most recent. */
export async function listAllReviews(): Promise<AdminReviewRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_reviews")
    .select(
      "*, course:courses(title), reviewer:profiles!course_reviews_user_id_fkey(full_name, email)",
    )
    .order("status", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load reviews: ${error.message}`);
  return data as unknown as AdminReviewRow[];
}

export type AdminModule = Database["public"]["Tables"]["modules"]["Row"] & {
  lessons: Database["public"]["Tables"]["lessons"]["Row"][];
};

export async function getCourseForAdmin(courseId: string) {
  const supabase = await createClient();

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError || !course) notFound();

  const { data: modules, error: modulesError } = await supabase
    .from("modules")
    .select("*, lessons(*)")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  if (modulesError) throw new Error(`Failed to load modules: ${modulesError.message}`);

  const sortedModules = (modules as unknown as AdminModule[]).map((m) => ({
    ...m,
    lessons: [...m.lessons].sort((a, b) => a.sort_order - b.sort_order),
  }));

  return { course, modules: sortedModules };
}

/** Every quiz regardless of status — the admin quiz list. */
export async function listQuizzesAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quizzes")
    .select("*, course:courses(title)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load quizzes: ${error.message}`);
  return data;
}

export type AdminQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"] & {
  quiz_options: Database["public"]["Tables"]["quiz_options"]["Row"][];
};

export async function getQuizForAdmin(quizId: string) {
  const supabase = await createClient();

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .maybeSingle();

  if (quizError || !quiz) notFound();

  const { data: questions, error: questionsError } = await supabase
    .from("quiz_questions")
    .select("*, quiz_options(*)")
    .eq("quiz_id", quizId)
    .order("sort_order", { ascending: true });

  if (questionsError)
    throw new Error(`Failed to load questions: ${questionsError.message}`);

  const sortedQuestions = (questions as unknown as AdminQuestion[]).map((q) => ({
    ...q,
    quiz_options: [...q.quiz_options].sort((a, b) => a.sort_order - b.sort_order),
  }));

  return { quiz, questions: sortedQuestions };
}

/** Dashboard headline numbers for the admin overview page. */
export async function getAdminOverview() {
  const supabase = await createClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: pendingReview },
    { count: totalStudents },
    { count: totalCourses },
    { data: paidOrders },
    { count: newEnrollmentsThisWeek },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("status", ["under_review", "pending"]),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("amount_cents").eq("status", "paid"),
    supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .gte("enrolled_at", weekAgo),
  ]);

  return {
    pendingReview: pendingReview ?? 0,
    totalStudents: totalStudents ?? 0,
    totalCourses: totalCourses ?? 0,
    revenueAllTimeCents: (paidOrders ?? []).reduce((sum, o) => sum + o.amount_cents, 0),
    newEnrollmentsThisWeek: newEnrollmentsThisWeek ?? 0,
  };
}

export type StudentSummaryRow = Database["public"]["Views"]["student_admin_summary"]["Row"];

/** Paginated, search-filterable student list for the admin students page. */
export async function listStudents({
  search,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ students: StudentSummaryRow[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from("student_admin_summary")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) {
    const term = `%${search}%`;
    query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);

  if (error) throw new Error(`Failed to load students: ${error.message}`);
  return { students: data ?? [], total: count ?? 0 };
}

export type StudentEnrollmentRow = Database["public"]["Tables"]["enrollments"]["Row"] & {
  course: { title: string; slug: string };
};
export type StudentOrderRow = Database["public"]["Tables"]["orders"]["Row"] & {
  course: { title: string };
};

/** One student's profile, enrollments and order history — for the detail page. */
export async function getStudentDetail(studentId: string) {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .maybeSingle();

  if (profileError || !profile) notFound();

  const [
    { data: enrollments, error: enrollmentsError },
    { data: orders, error: ordersError },
  ] = await Promise.all([
    supabase
      .from("enrollments")
      .select("*, course:courses(title, slug)")
      .eq("user_id", studentId)
      .order("enrolled_at", { ascending: false }),
    supabase
      .from("orders")
      .select("*, course:courses(title)")
      .eq("user_id", studentId)
      .order("created_at", { ascending: false }),
  ]);

  if (enrollmentsError)
    throw new Error(`Failed to load enrollments: ${enrollmentsError.message}`);
  if (ordersError) throw new Error(`Failed to load orders: ${ordersError.message}`);

  return {
    profile,
    enrollments: (enrollments ?? []) as unknown as StudentEnrollmentRow[],
    orders: (orders ?? []) as unknown as StudentOrderRow[],
  };
}

export type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];

/**
 * Full session rows, including `join_url` — via the service-role client,
 * since `authenticated` (the DB role admins share with students) has no
 * SELECT grant on that one column (0015_sessions_access.sql). Everything
 * else here is exactly what `listOrdersForReview` etc. do: a read, not a
 * privileged mutation, it's just that this particular table has a column
 * plain RLS cannot gate per-reader.
 */
export async function listSessionsAdmin(): Promise<SessionRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sessions")
    .select("*")
    .order("starts_at", { ascending: false });

  if (error) throw new Error(`Failed to load sessions: ${error.message}`);
  return data;
}

export async function getSessionForAdmin(sessionId: string): Promise<SessionRow> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !data) notFound();
  return data;
}

export type SessionRegistrationAdminRow =
  Database["public"]["Tables"]["session_registrations"]["Row"] & {
    student: { full_name: string; email: string };
  };

/** Registrations for one session, via the plain client — RLS's admin policy is the real gate. */
export async function listRegistrationsForSession(
  sessionId: string,
): Promise<SessionRegistrationAdminRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_registrations")
    .select("*, student:profiles!session_registrations_user_id_fkey(full_name, email)")
    .eq("session_id", sessionId)
    .order("registered_at", { ascending: true });

  if (error) throw new Error(`Failed to load registrations: ${error.message}`);
  return data as unknown as SessionRegistrationAdminRow[];
}
