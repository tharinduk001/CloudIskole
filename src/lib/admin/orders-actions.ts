"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/actions/result";
import { requireAdmin } from "@/lib/data/auth";
import { enqueueNotification } from "@/lib/notifications/outbox";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Approves a bank-transfer order: marks it paid and grants the enrollment.
 *
 * `grant_enrollment()` is revoked from `authenticated` on purpose (see
 * 0004_payments.sql) — only `service_role` may call it, so this goes through
 * the admin client. The actor id comes from `requireAdmin()`'s own
 * re-verified session, never from form input, so a request cannot forge who
 * approved a payment.
 */
export async function approveOrder(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = z.object({ orderId: z.uuid() }).safeParse({ orderId: formData.get("orderId") });
  if (!parsed.success) {
    return { status: "error", message: "That order could not be found." };
  }

  const admin = await requireAdmin();
  const adminClient = createAdminClient();

  const { error } = await adminClient.rpc("grant_enrollment", {
    p_order_id: parsed.data.orderId,
    p_actor_id: admin.id,
    p_note: "Approved via admin dashboard",
  });

  if (error) {
    console.error("approveOrder failed", error);
    return { status: "error", message: `Could not approve this order: ${error.message}` };
  }

  const { data: order } = await adminClient
    .from("orders")
    .select("user_id, amount_cents, course:courses(title)")
    .eq("id", parsed.data.orderId)
    .maybeSingle();

  const { data: student } = order
    ? await adminClient.from("profiles").select("email, full_name").eq("id", order.user_id).maybeSingle()
    : { data: null };

  if (student?.email) {
    await enqueueNotification({
      channel: "email",
      recipient: student.email,
      userId: order?.user_id,
      template: "payment_approved",
      dedupeKey: `payment_approved:${parsed.data.orderId}`,
      payload: {
        subject: "Your CloudIskole payment is confirmed",
        html: `<p>Hi ${student.full_name ?? "there"},</p><p>Your payment has been confirmed and you're now enrolled${
          order && "course" in order && order.course ? ` in ${(order.course as { title: string }).title}` : ""
        }.</p>`,
      },
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);

  return { status: "success", message: "Order approved and enrollment granted." };
}

const rejectSchema = z.object({
  orderId: z.uuid(),
  reason: z.string().trim().min(3, "Please give a reason.").max(500),
});

/** Declines a submitted slip, logging the reason with the same rigour as an approval. */
export async function rejectOrder(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = rejectSchema.safeParse({
    orderId: formData.get("orderId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please provide a reason.",
    };
  }

  const admin = await requireAdmin();
  const adminClient = createAdminClient();

  const { error } = await adminClient.rpc("reject_order", {
    p_order_id: parsed.data.orderId,
    p_actor_id: admin.id,
    p_reason: parsed.data.reason,
  });

  if (error) {
    console.error("rejectOrder failed", error);
    return { status: "error", message: `Could not reject this order: ${error.message}` };
  }

  const { data: order } = await adminClient
    .from("orders")
    .select("user_id")
    .eq("id", parsed.data.orderId)
    .maybeSingle();

  const { data: student } = order
    ? await adminClient.from("profiles").select("email, full_name").eq("id", order.user_id).maybeSingle()
    : { data: null };

  if (student?.email) {
    await enqueueNotification({
      channel: "email",
      recipient: student.email,
      userId: order?.user_id,
      template: "payment_rejected",
      dedupeKey: `payment_rejected:${parsed.data.orderId}:${Date.now()}`,
      payload: {
        subject: "We couldn't confirm your CloudIskole payment",
        html: `<p>Hi ${student.full_name ?? "there"},</p><p>We couldn't confirm your recent bank transfer: ${parsed.data.reason}. Please check your checkout page to upload a new receipt.</p>`,
      },
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);

  return { status: "success", message: "Order rejected." };
}

/** Signed URL for the admin to inspect a submitted slip. */
export async function getAdminSlipUrl(path: string): Promise<string | null> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("payment-slips").createSignedUrl(path, 60 * 5);
  if (error) return null;
  return data.signedUrl;
}
