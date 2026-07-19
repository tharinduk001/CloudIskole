import "server-only";

import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type BankTransferRow = Database["public"]["Tables"]["bank_transfers"]["Row"];
export type PaymentEventRow = Database["public"]["Tables"]["payment_events"]["Row"];

export type OrderWithCourse = OrderRow & {
  course: { title: string; slug: string; thumbnail_path: string | null };
};

/**
 * An order the signed-in student owns, joined with the course it's for.
 *
 * RLS ("orders: read own") is what actually stops one student from loading
 * another's order by guessing an id — this just adds the 404/redirect shape
 * a page needs.
 */
export async function getOrderForCheckout(orderId: string): Promise<OrderWithCourse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/checkout/${orderId}`)}`);

  const { data, error } = await supabase
    .from("orders")
    .select("*, course:courses(title, slug, thumbnail_path)")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) notFound();

  return data as OrderWithCourse;
}

/** The bank transfer slip submitted for an order, if any. */
export async function getBankTransferForOrder(
  orderId: string,
): Promise<BankTransferRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bank_transfers")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  return data;
}

/** A signed URL for a private payment-slips object, valid for 5 minutes. */
export async function getSlipSignedUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("payment-slips")
    .createSignedUrl(path, 60 * 5);

  if (error) return null;
  return data.signedUrl;
}
