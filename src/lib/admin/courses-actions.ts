"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { ActionResult } from "@/lib/actions/result";
import { toFieldErrors } from "@/lib/actions/result";
import { requireAdmin } from "@/lib/data/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Course, module and lesson mutations for the admin builder.
 *
 * These run as the signed-in admin through the regular server client, not
 * the service-role one — `courses`/`modules`/`lessons` already carry an
 * "admin full access" RLS policy (0003_courses.sql), so plain RLS is the
 * real gate here. `requireAdmin()` still runs first in every action: RLS
 * would reject a non-admin's write anyway, but this fails fast with a page
 * redirect a signed-in student can't even reach the form to trigger.
 */

const courseSchema = z.object({
  id: z.uuid().optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only."),
  title: z.string().trim().min(3).max(200),
  subtitle: z.string().trim().max(300).optional(),
  description: z.string().trim().max(4000).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  category: z.string().trim().max(80).optional(),
  isFree: z.union([z.literal("on"), z.null()]).optional(),
  priceRupees: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Math.round(Number(v) * 100) : 0)),
  durationMinutes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
  sortOrder: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : 0)),
});

export async function upsertCourse(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const isFree = formData.get("isFree") === "on";
  const parsed = courseSchema.safeParse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    title: formData.get("title"),
    subtitle: formData.get("subtitle") || undefined,
    description: formData.get("description") || undefined,
    level: formData.get("level"),
    category: formData.get("category") || undefined,
    isFree: formData.get("isFree"),
    priceRupees: isFree ? undefined : formData.get("priceRupees") || undefined,
    durationMinutes: formData.get("durationMinutes") || undefined,
    sortOrder: formData.get("sortOrder") || undefined,
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
    title: parsed.data.title,
    subtitle: parsed.data.subtitle ?? null,
    description: parsed.data.description ?? null,
    level: parsed.data.level,
    category: parsed.data.category ?? null,
    is_free: isFree,
    price_cents: isFree ? 0 : parsed.data.priceRupees,
    duration_minutes: parsed.data.durationMinutes ?? null,
    sort_order: parsed.data.sortOrder,
  };

  if (parsed.data.id) {
    const { error } = await supabase.from("courses").update(row).eq("id", parsed.data.id);
    if (error) {
      console.error("upsertCourse update failed", error);
      return { status: "error", message: "Could not save this course." };
    }
    revalidatePath(`/admin/courses/${parsed.data.id}`);
    revalidatePath("/admin/courses");
    revalidatePath(`/courses/${parsed.data.slug}`);
    return { status: "success", message: "Course saved." };
  }

  const { data: created, error } = await supabase
    .from("courses")
    .insert(row)
    .select("id")
    .single();
  if (error || !created) {
    console.error("upsertCourse insert failed", error);
    return {
      status: "error",
      message:
        error?.code === "23505"
          ? "That slug is already in use."
          : "Could not create this course.",
    };
  }

  revalidatePath("/admin/courses");
  redirect(`/admin/courses/${created.id}`);
}

export async function setCourseStatus(
  courseId: string,
  status: "draft" | "published" | "archived",
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("courses")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : undefined,
    })
    .eq("id", courseId);

  if (error) {
    console.error("setCourseStatus failed", error);
    return { status: "error", message: "Could not update the course status." };
  }

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return { status: "success" };
}

const moduleSchema = z.object({
  id: z.uuid().optional(),
  courseId: z.uuid(),
  title: z.string().trim().min(2).max(200),
  summary: z.string().trim().max(500).optional(),
  sortOrder: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : 0)),
});

export async function upsertModule(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = moduleSchema.safeParse({
    id: formData.get("id") || undefined,
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    summary: formData.get("summary") || undefined,
    sortOrder: formData.get("sortOrder") || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: "Please check the highlighted fields." };
  }

  const supabase = await createClient();
  const row = {
    course_id: parsed.data.courseId,
    title: parsed.data.title,
    summary: parsed.data.summary ?? null,
    sort_order: parsed.data.sortOrder,
  };

  const { error } = parsed.data.id
    ? await supabase.from("modules").update(row).eq("id", parsed.data.id)
    : await supabase.from("modules").insert(row);

  if (error) {
    console.error("upsertModule failed", error);
    return { status: "error", message: "Could not save this module." };
  }

  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
  return { status: "success", message: "Module saved." };
}

export async function deleteModule(
  moduleId: string,
  courseId: string,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("modules").delete().eq("id", moduleId);
  if (error) {
    console.error("deleteModule failed", error);
    return { status: "error", message: "Could not delete this module." };
  }
  revalidatePath(`/admin/courses/${courseId}`);
  return { status: "success" };
}

const lessonSchema = z.object({
  id: z.uuid().optional(),
  moduleId: z.uuid(),
  courseId: z.uuid(),
  title: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only."),
  type: z.enum(["video", "text", "pdf"]),
  youtubeId: z.string().trim().max(20).optional(),
  contentMdx: z.string().optional(),
  attachmentPath: z.string().trim().max(500).optional(),
  durationSeconds: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : undefined)),
  isPreview: z.union([z.literal("on"), z.null()]).optional(),
  sortOrder: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : 0)),
});

export async function upsertLesson(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = lessonSchema.safeParse({
    id: formData.get("id") || undefined,
    moduleId: formData.get("moduleId"),
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    type: formData.get("type"),
    youtubeId: formData.get("youtubeId") || undefined,
    contentMdx: formData.get("contentMdx") || undefined,
    attachmentPath: formData.get("attachmentPath") || undefined,
    durationSeconds: formData.get("durationSeconds") || undefined,
    isPreview: formData.get("isPreview"),
    sortOrder: formData.get("sortOrder") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (
    (parsed.data.type === "video" && !parsed.data.youtubeId) ||
    (parsed.data.type === "text" && !parsed.data.contentMdx) ||
    (parsed.data.type === "pdf" && !parsed.data.attachmentPath)
  ) {
    return {
      status: "error",
      message: `A ${parsed.data.type} lesson needs its matching content field filled in.`,
    };
  }

  const supabase = await createClient();
  const row = {
    module_id: parsed.data.moduleId,
    course_id: parsed.data.courseId,
    title: parsed.data.title,
    slug: parsed.data.slug,
    type: parsed.data.type,
    youtube_id: parsed.data.type === "video" ? parsed.data.youtubeId : null,
    content_mdx: parsed.data.type === "text" ? parsed.data.contentMdx : null,
    attachment_path: parsed.data.type === "pdf" ? parsed.data.attachmentPath : null,
    duration_seconds: parsed.data.durationSeconds ?? null,
    is_preview: parsed.data.isPreview === "on",
    sort_order: parsed.data.sortOrder,
  };

  const { error } = parsed.data.id
    ? await supabase.from("lessons").update(row).eq("id", parsed.data.id)
    : await supabase.from("lessons").insert(row);

  if (error) {
    console.error("upsertLesson failed", error);
    return {
      status: "error",
      message:
        error.code === "23505"
          ? "That slug is already used in this course."
          : "Could not save this lesson.",
    };
  }

  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
  return { status: "success", message: "Lesson saved." };
}

export async function deleteLesson(
  lessonId: string,
  courseId: string,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
  if (error) {
    console.error("deleteLesson failed", error);
    return { status: "error", message: "Could not delete this lesson." };
  }
  revalidatePath(`/admin/courses/${courseId}`);
  return { status: "success" };
}
