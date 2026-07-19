"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/actions/result";
import { sendSms } from "@/lib/notifications/textlk";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+94[0-9]{9}$/, "Enter a Sri Lankan number as +94XXXXXXXXX."),
});

/**
 * Requests a one-time SMS code for the phone on file.
 *
 * `request_phone_otp()` does the actual work — rate limiting, hashing,
 * recording the (unverified) number on the profile — and hands back the raw
 * code exactly once, for this action to forward over SMS. It is never
 * stored anywhere in the clear, including here: this function does not log
 * it, only passes it to the SMS adapter.
 */
export async function requestPhoneOtp(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = phoneSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid phone number." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Please sign in." };
  }

  // Defense-in-depth on top of `request_phone_otp()`'s own per-user cooldown:
  // this catches one account cycling through many numbers, which SMS credit
  // makes real money.
  const ip = await getClientIp();
  const limited = await rateLimit("phone.request-otp", `${ip}:${user.id}`, 5, 3600);
  if (!limited.allowed) {
    return { status: "error", message: "Too many attempts. Please wait a while and try again." };
  }

  const { data: code, error } = await supabase.rpc("request_phone_otp", {
    p_phone: parsed.data.phone,
  });

  if (error) {
    return {
      status: "error",
      message: error.message.includes("wait")
        ? "Please wait a minute before requesting another code."
        : "We could not send a code to that number.",
    };
  }

  const sms = await sendSms(
    parsed.data.phone,
    `${code} is your CloudIskole verification code. It expires in 10 minutes.`,
  );

  if (!sms.ok && !sms.skipped) {
    console.error("requestPhoneOtp: SMS send failed", sms.error);
    return {
      status: "error",
      message: "We generated a code but could not send the SMS. Please try again shortly.",
    };
  }

  revalidatePath("/profile");

  return {
    status: "success",
    message: sms.skipped
      ? `SMS is not configured in this environment. Dev code: ${code}`
      : `We sent a code to ${parsed.data.phone}.`,
  };
}

const otpSchema = z.object({
  code: z.string().trim().regex(/^[0-9]{6}$/, "Enter the 6-digit code."),
});

/** Verifies the code the student typed back in. */
export async function verifyPhoneOtp(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = otpSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { status: "error", message: "Enter the 6-digit code." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Please sign in." };
  }

  const { data: verified, error } = await supabase.rpc("verify_phone_otp", {
    p_code: parsed.data.code,
  });

  if (error || !verified) {
    return { status: "error", message: "That code is wrong or has expired." };
  }

  revalidatePath("/profile");
  revalidatePath("/checkout", "layout");

  return { status: "success", message: "Phone number verified." };
}
