"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/actions/result";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.object({ sessionId: z.uuid() });

/**
 * Registers the signed-in student. Goes through the plain client: the
 * "register self" RLS policy plus the `tg_enforce_session_capacity` trigger
 * (0006_sessions.sql) are the real gate — a full session or a session that
 * has already gone live/completed rejects the insert with a message this
 * maps straight through.
 */
export async function registerForSession(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = idSchema.safeParse({ sessionId: formData.get("sessionId") });
  if (!parsed.success) {
    return { status: "error", message: "That session could not be found." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Please sign in to register." };
  }

  const { error } = await supabase
    .from("session_registrations")
    .insert({ session_id: parsed.data.sessionId, user_id: user.id });

  if (error) {
    const message =
      error.code === "23505"
        ? "You're already registered for this session."
        : error.message.includes("full")
          ? "This session is full."
          : error.message.includes("closed")
            ? "Registration is closed for this session."
            : "Could not register for this session.";
    return { status: "error", message };
  }

  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  return {
    status: "success",
    message: "You're registered! We'll email you the details.",
  };
}

export async function cancelRegistration(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = idSchema.safeParse({ sessionId: formData.get("sessionId") });
  if (!parsed.success) {
    return { status: "error", message: "That session could not be found." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Please sign in." };
  }

  const { error } = await supabase
    .from("session_registrations")
    .delete()
    .eq("session_id", parsed.data.sessionId)
    .eq("user_id", user.id);

  if (error) {
    return { status: "error", message: "Could not cancel your registration." };
  }

  revalidatePath("/sessions");
  revalidatePath("/dashboard");
  return { status: "success", message: "Registration cancelled." };
}
