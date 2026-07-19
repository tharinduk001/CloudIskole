"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/actions/result";
import { toFieldErrors } from "@/lib/actions/result";
import { requireAdmin } from "@/lib/data/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Badge and certificate management for the admin dashboard.
 *
 * Both tables carry an "admin full access" RLS policy (0007_gamification.sql),
 * so — same trust model as the course/quiz builders — these run through the
 * signed-in admin's own session, not the service-role client. There is no
 * secret column here the way there is on `sessions.join_url`.
 */

const badgeSchema = z.object({
  id: z.uuid().optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only."),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(300).optional(),
  icon: z.string().trim().max(8).optional(),
});

export async function upsertBadge(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = badgeSchema.safeParse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    icon: formData.get("icon") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const row = {
    slug: parsed.data.slug,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    icon: parsed.data.icon ?? null,
  };

  const { error } = parsed.data.id
    ? await supabase.from("badges").update(row).eq("id", parsed.data.id)
    : await supabase.from("badges").insert(row);

  if (error) {
    console.error("upsertBadge failed", error);
    return {
      status: "error",
      message:
        error.code === "23505"
          ? "That slug is already in use."
          : "Could not save this badge.",
    };
  }

  revalidatePath("/admin/badges");
  return { status: "success", message: "Badge saved." };
}

export async function deleteBadge(badgeId: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("badges").delete().eq("id", badgeId);
  if (error) {
    console.error("deleteBadge failed", error);
    return { status: "error", message: "Could not delete this badge." };
  }
  revalidatePath("/admin/badges");
  return { status: "success" };
}

const revokeSchema = z.object({
  certificateId: z.uuid(),
  reason: z.string().trim().min(3, "Give a reason.").max(300),
});

export async function revokeCertificate(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = revokeSchema.safeParse({
    certificateId: formData.get("certificateId"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please provide a reason.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("certificates")
    .update({ revoked_at: new Date().toISOString(), revoke_reason: parsed.data.reason })
    .eq("id", parsed.data.certificateId);

  if (error) {
    console.error("revokeCertificate failed", error);
    return { status: "error", message: "Could not revoke this certificate." };
  }

  revalidatePath("/admin/certificates");
  return { status: "success", message: "Certificate revoked." };
}

const externalBadgeSchema = z.object({
  certificateId: z.uuid(),
  externalBadgeUrl: z
    .string()
    .trim()
    .url("Enter a valid URL.")
    .max(500)
    .optional()
    .or(z.literal("")),
});

/**
 * Records an externally-issued digital badge URL (e.g. credentials.
 * certdirectory.io) manually, per the build plan's fallback: evaluate that
 * API when this phase is reached, and if it has no public API, an admin
 * records the badge URL by hand once issued there.
 */
export async function setCertificateExternalBadgeUrl(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = externalBadgeSchema.safeParse({
    certificateId: formData.get("certificateId"),
    externalBadgeUrl: formData.get("externalBadgeUrl") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Enter a valid URL.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("certificates")
    .update({ external_badge_url: parsed.data.externalBadgeUrl || null })
    .eq("id", parsed.data.certificateId);

  if (error) {
    console.error("setCertificateExternalBadgeUrl failed", error);
    return { status: "error", message: "Could not save the badge URL." };
  }

  revalidatePath("/admin/certificates");
  return { status: "success", message: "Saved." };
}
