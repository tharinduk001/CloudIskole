"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  friendlyAuthError,
  toFieldErrors,
  type ActionResult,
} from "@/lib/actions/result";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

/** Only allow same-site redirect targets — never an absolute URL from input. */
function safeNext(next: string | null | undefined): string {
  if (!next) return "/dashboard";
  // Rejects "//evil.com" and "https://evil.com" as well as any scheme.
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

const emailSchema = z.object({
  email: z.email({ message: "Enter a valid email address." }).trim().toLowerCase(),
  next: z.string().optional(),
});

/**
 * Step 1 of email sign-in: mail the student a 6-digit code.
 *
 * `shouldCreateUser: true` means sign-in and sign-up are the same flow — one
 * fewer decision for the student, and no way to enumerate which addresses
 * already have accounts, since the response is identical either way.
 */
export async function sendEmailOtp(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the form.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const ip = await getClientIp();
  const limited = await rateLimit("auth.send-otp", `${ip}:${parsed.data.email}`, 5, 600);
  if (!limited.allowed) {
    return {
      status: "error",
      message: "Too many attempts. Please wait a minute and try again.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    return { status: "error", message: friendlyAuthError(error.message) };
  }

  return {
    status: "success",
    message: `We sent a 6-digit code to ${parsed.data.email}. It expires in 10 minutes.`,
  };
}

const verifySchema = z.object({
  email: z.email().trim().toLowerCase(),
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, { message: "Enter the 6-digit code from your email." }),
  next: z.string().optional(),
});

/** Step 2: exchange the emailed code for a session. */
export async function verifyEmailOtp(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = verifySchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the code.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const ip = await getClientIp();
  const limited = await rateLimit(
    "auth.verify-otp",
    `${ip}:${parsed.data.email}`,
    10,
    600,
  );
  if (!limited.allowed) {
    return {
      status: "error",
      message: "Too many attempts. Please wait a minute and try again.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "email",
  });

  if (error) {
    return { status: "error", message: friendlyAuthError(error.message) };
  }

  // redirect() throws a control-flow signal, so it must sit outside any
  // try/catch and after every fallible call.
  redirect(safeNext(parsed.data.next));
}

/** Ends the session and returns the visitor to the home page. */
export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
