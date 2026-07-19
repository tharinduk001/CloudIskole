"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/actions/result";
import { toFieldErrors } from "@/lib/actions/result";
import { requireAdmin } from "@/lib/data/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Badge management for the admin dashboard.
 *
 * Carries an "admin full access" RLS policy (0007_gamification.sql), so —
 * same trust model as the course/quiz builders — this runs through the
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
