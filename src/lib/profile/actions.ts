"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { toFieldErrors, type ActionResult } from "@/lib/actions/result";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(120),
  leaderboardOptIn: z.union([z.literal("on"), z.null()]).optional(),
  marketingOptIn: z.union([z.literal("on"), z.null()]).optional(),
});

/**
 * Updates the signed-in student's editable profile fields.
 *
 * Deliberately only touches the columns the "profiles: update own" GRANT
 * allows (see 20260719001000_grants.sql) — `role`, `phone_verified_at` and
 * identity columns are excluded from this schema on purpose, not merely left
 * out of the form. Even a hand-crafted request against this action cannot
 * reach them: the database has no column privilege to grant it in the first
 * place.
 */
export async function updateProfile(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    leaderboardOptIn: formData.get("leaderboardOptIn"),
    marketingOptIn: formData.get("marketingOptIn"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Please sign in." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      leaderboard_opt_in: parsed.data.leaderboardOptIn === "on",
      marketing_opt_in: parsed.data.marketingOptIn === "on",
    })
    .eq("id", user.id);

  if (error) {
    console.error("updateProfile failed", error);
    return { status: "error", message: "We could not save your changes. Please retry." };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { status: "success", message: "Profile updated." };
}

const avatarSchema = z.object({
  path: z.string().trim().min(1),
});

/**
 * Records the storage path of an avatar the student just uploaded directly
 * to the `avatars` bucket from the browser.
 *
 * The upload itself happens client-side against Supabase Storage — the
 * bucket's own RLS policy ("avatars: owner writes own folder") is what
 * actually authorises that, keyed on the folder matching the caller's user
 * id. This action only persists the resulting public URL onto the profile
 * row; it does not and cannot write outside the caller's own folder, since
 * the upload it is recording already had to pass that check to exist.
 */
export async function setAvatarUrl(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = avatarSchema.safeParse({ path: formData.get("path") });
  if (!parsed.success) {
    return { status: "error", message: "That upload could not be recorded." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Please sign in." };
  }

  // Defence in depth: confirm the path is actually inside this user's folder
  // before trusting it, even though the storage policy already enforced this
  // at upload time.
  if (!parsed.data.path.startsWith(`${user.id}/`)) {
    return { status: "error", message: "That upload could not be recorded." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(parsed.data.path);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (error) {
    console.error("setAvatarUrl failed", error);
    return { status: "error", message: "We could not save your new photo." };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { status: "success" };
}
