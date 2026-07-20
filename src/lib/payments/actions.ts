"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/actions/result";
import { createClient } from "@/lib/supabase/server";

const startCheckoutSchema = z.object({
  courseId: z.uuid(),
});

/**
 * Opens (or resumes) a pending order for a paid course and sends the student
 * to the checkout page for it.
 *
 * All of the actual validation — course must be published, must not be free,
 * price is copied from the live listing, one open order per course — lives
 * inside `create_order()` (see 20260719001300_orders_payments_phone.sql).
 * This action is a thin, typed front door onto that function; a hand-crafted
 * request that skipped this form entirely would still hit the same checks.
 */
export async function startCheckout(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = startCheckoutSchema.safeParse({ courseId: formData.get("courseId") });
  if (!parsed.success) {
    return { status: "error", message: "That course could not be found." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent("/courses")}`);
  }

  const { data: order, error } = await supabase.rpc("create_order", {
    p_course_id: parsed.data.courseId,
  });

  if (error || !order) {
    console.error("startCheckout failed", error);
    return {
      status: "error",
      message: error?.message.includes("Already enrolled")
        ? "You're already enrolled in this course."
        : "We could not start checkout for this course. Please try again.",
    };
  }

  redirect(`/checkout/${order.id}`);
}

const submitSlipSchema = z.object({
  orderId: z.uuid(),
  slipPath: z.string().trim().min(1),
  depositorName: z.string().trim().max(120).optional(),
  depositedAt: z.string().trim().optional(),
  amountDeclared: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Math.round(Number(v) * 100) : undefined))
    .refine((v) => v === undefined || (Number.isFinite(v) && v > 0), {
      message: "Enter a valid amount.",
    }),
});

/**
 * Records proof of a bank deposit against an order the student opened.
 *
 * The file itself was already uploaded straight from the browser to the
 * private `payment-slips` bucket before this runs — the bucket's own RLS
 * policy ("payment-slips: owner uploads own folder") is what authorised
 * that. This just tells the database the upload happened, via
 * `submit_bank_transfer_slip()`, which is also what moves the order to
 * `under_review` — a status change students cannot make by any direct write.
 */
export async function submitPaymentSlip(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = submitSlipSchema.safeParse({
    orderId: formData.get("orderId"),
    slipPath: formData.get("slipPath"),
    depositorName: formData.get("depositorName") || undefined,
    depositedAt: formData.get("depositedAt") || undefined,
    amountDeclared: formData.get("amountDeclared") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Please sign in." };
  }

  // Defence in depth: the upload already had to land inside this folder to
  // pass the storage policy, but confirm it here too before trusting it.
  if (!parsed.data.slipPath.startsWith(`payment-slips/${user.id}/`)) {
    return { status: "error", message: "That upload could not be recorded." };
  }

  const objectPath = parsed.data.slipPath.replace(/^payment-slips\//, "");

  const { error } = await supabase.rpc("submit_bank_transfer_slip", {
    p_order_id: parsed.data.orderId,
    p_slip_path: objectPath,
    p_depositor_name: parsed.data.depositorName,
    p_deposited_at: parsed.data.depositedAt,
    p_amount_declared_cents: parsed.data.amountDeclared,
  });

  if (error) {
    console.error("submitPaymentSlip failed", error);
    return {
      status: "error",
      message: "We could not record your slip. Please try again.",
    };
  }

  revalidatePath(`/checkout/${parsed.data.orderId}`);

  return { status: "success", message: "Slip submitted - we'll review it shortly." };
}
