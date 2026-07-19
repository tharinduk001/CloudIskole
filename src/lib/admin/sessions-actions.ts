"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { ActionResult } from "@/lib/actions/result";
import { toFieldErrors } from "@/lib/actions/result";
import { requireAdmin } from "@/lib/data/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Session mutations for the admin scheduler.
 *
 * Unlike courses/quizzes, `sessions` has no student-readable `join_url`
 * column at the GRANT layer (0015_sessions_access.sql) — only
 * `service_role` and the owner of SECURITY DEFINER functions can read or
 * write it directly. An admin editing a session needs to see and set
 * `join_url` in the same request, so these actions go through the
 * service-role client rather than the signed-in admin's own session. This
 * mirrors the existing exception for payment approval and the notification
 * outbox: narrow, and only where the RLS/grant model genuinely cannot
 * express what's needed.
 *
 * `markAttendance` is the one exception to the exception: it writes
 * `session_registrations.attended`, which `tg_protect_attendance` guards
 * with `is_admin()` — a check that reads `auth.uid()` and therefore only
 * passes for the real signed-in admin, never for the service-role client
 * (which has no `auth.uid()`). So that action stays on the plain client.
 */

type SessionStatus = Database["public"]["Enums"]["session_status"];

const sessionSchema = z.object({
  id: z.uuid().optional(),
  slug: z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only."),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(4000).optional(),
  startsAt: z.string().trim().min(1, "Pick a start date and time."),
  durationMinutes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : 60)),
  hostName: z.string().trim().max(120).optional(),
  joinUrl: z.string().trim().url("Enter a valid URL.").max(500).optional().or(z.literal("")),
  recordingUrl: z.string().trim().url("Enter a valid URL.").max(500).optional().or(z.literal("")),
  capacity: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
  isFree: z.union([z.literal("on"), z.null()]).optional(),
  courseId: z.uuid().optional(),
});

export async function upsertSession(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = sessionSchema.safeParse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    startsAt: formData.get("startsAt"),
    durationMinutes: formData.get("durationMinutes") || undefined,
    hostName: formData.get("hostName") || undefined,
    joinUrl: formData.get("joinUrl") || undefined,
    recordingUrl: formData.get("recordingUrl") || undefined,
    capacity: formData.get("capacity") || undefined,
    isFree: formData.get("isFree"),
    courseId: formData.get("courseId") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  // `startsAt` comes from a `datetime-local` input with no timezone of its
  // own. It is always entered and displayed as Asia/Colombo wall time (see
  // session-form.tsx) — appending the fixed +05:30 offset here means the
  // stored instant is correct regardless of the server's own timezone
  // (Vercel runs in UTC; a plain `new Date(startsAt)` would have silently
  // parsed it as UTC there and shifted every session by 5.5 hours).
  const startsAt = new Date(`${parsed.data.startsAt}:00+05:30`);
  if (Number.isNaN(startsAt.getTime())) {
    return { status: "error", message: "That start date and time is not valid." };
  }

  const adminClient = createAdminClient();
  const row = {
    slug: parsed.data.slug,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    starts_at: startsAt.toISOString(),
    duration_minutes: parsed.data.durationMinutes,
    host_name: parsed.data.hostName ?? null,
    join_url: parsed.data.joinUrl || null,
    recording_url: parsed.data.recordingUrl || null,
    capacity: parsed.data.capacity ?? null,
    is_free: parsed.data.isFree === "on",
    course_id: parsed.data.courseId ?? null,
  };

  if (parsed.data.id) {
    const { error } = await adminClient.from("sessions").update(row).eq("id", parsed.data.id);
    if (error) {
      console.error("upsertSession update failed", error);
      return {
        status: "error",
        message:
          error.code === "23505"
            ? "That slug is already in use."
            : `Could not save this session: ${error.message}`,
      };
    }
    revalidatePath(`/admin/sessions/${parsed.data.id}`);
    revalidatePath("/admin/sessions");
    revalidatePath("/sessions");
    return { status: "success", message: "Session saved." };
  }

  const { data: created, error } = await adminClient
    .from("sessions")
    .insert({ ...row, status: "upcoming" })
    .select("id")
    .single();

  if (error || !created) {
    console.error("upsertSession insert failed", error);
    return {
      status: "error",
      message: error?.code === "23505" ? "That slug is already in use." : "Could not create this session.",
    };
  }

  revalidatePath("/admin/sessions");
  redirect(`/admin/sessions/${created.id}`);
}

const allowedTransitions: Record<SessionStatus, SessionStatus[]> = {
  upcoming: ["live", "cancelled"],
  live: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function setSessionStatus(
  sessionId: string,
  currentStatus: SessionStatus,
  nextStatus: SessionStatus,
): Promise<ActionResult> {
  await requireAdmin();

  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    return { status: "error", message: `Cannot move a session from ${currentStatus} to ${nextStatus}.` };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("sessions").update({ status: nextStatus }).eq("id", sessionId);

  if (error) {
    console.error("setSessionStatus failed", error);
    return { status: "error", message: `Could not update the session status: ${error.message}` };
  }

  revalidatePath(`/admin/sessions/${sessionId}`);
  revalidatePath("/admin/sessions");
  revalidatePath("/sessions");
  return { status: "success" };
}

export async function markAttendance(
  sessionId: string,
  userId: string,
  attended: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("session_registrations")
    .update({ attended })
    .eq("session_id", sessionId)
    .eq("user_id", userId);

  if (error) {
    console.error("markAttendance failed", error);
    return { status: "error", message: "Could not update attendance." };
  }

  revalidatePath(`/admin/sessions/${sessionId}`);
  return { status: "success" };
}
