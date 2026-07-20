"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { toFieldErrors, type ActionResult } from "@/lib/actions/result";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name.").max(120),
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^(\+94|0)?[0-9]{9}$/, "Enter a valid Sri Lankan mobile number.")
    .optional()
    .or(z.literal("")),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Please give us a little more detail (at least 10 characters).")
    .max(4000, "That message is too long - please keep it under 4000 characters."),
  // Honeypot: a real person never fills a field they cannot see.
  website: z.string().max(0).optional().or(z.literal("")),
});

/** Normalises 0771234567 / +94771234567 / 771234567 to E.164. */
function toE164(input: string): string | null {
  const digits = input.replace(/\s+/g, "");
  if (!digits) return null;
  if (digits.startsWith("+94")) return digits;
  if (digits.startsWith("0")) return `+94${digits.slice(1)}`;
  return `+94${digits}`;
}

export async function submitContactMessage(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    website: formData.get("website"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  // Silently accept and discard bot submissions: telling a bot it failed just
  // teaches it to try again.
  if (parsed.data.website) {
    return { status: "success", message: "Thanks - we'll be in touch soon." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? null;

  const limited = await rateLimit("contact.submit", ip ?? "unknown", 5, 3600);
  if (!limited.allowed) {
    return {
      status: "error",
      message:
        "You've sent a few messages already - please wait a bit before sending another.",
    };
  }

  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ? toE164(parsed.data.phone) : null,
    subject: parsed.data.subject || null,
    message: parsed.data.message,
    user_id: user?.id ?? null,
    ip,
    user_agent: headerList.get("user-agent"),
  });

  if (error) {
    // Log the detail server-side; show the user something they can act on.
    console.error("contact_messages insert failed", error);
    return {
      status: "error",
      message:
        "We could not send your message just now. Please email us directly at hello@cloudiskole.lk.",
    };
  }

  return {
    status: "success",
    message: "Thanks - we've got your message and will reply within 2 working days.",
  };
}
