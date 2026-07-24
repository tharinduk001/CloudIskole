"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/actions/result";
import { toFieldErrors } from "@/lib/actions/result";
import { requireAdmin } from "@/lib/data/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Mutations for the site-content admin panel: partners, moments photos, and
 * the founder profile (bio, education, experience, certifications).
 *
 * Same shape as courses-actions.ts — plain RLS-scoped client, `requireAdmin()`
 * first for a fast redirect, RLS itself is the real gate.
 */

function revalidatePublicPages() {
  revalidatePath("/");
  revalidatePath("/about");
}

const cloudinaryUrl = z
  .string()
  .trim()
  .url("Enter a valid URL.")
  .max(500)
  .refine(
    (url) => new URL(url).hostname === "res.cloudinary.com",
    "Must be a Cloudinary URL (res.cloudinary.com).",
  );

const sortOrderField = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? Number(v) : 0));

// --- Partners ----------------------------------------------------------

const partnerSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2).max(200),
  logoUrl: cloudinaryUrl,
  sortOrder: sortOrderField,
});

export async function upsertPartner(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = partnerSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    logoUrl: formData.get("logoUrl"),
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
    name: parsed.data.name,
    logo_url: parsed.data.logoUrl,
    sort_order: parsed.data.sortOrder,
  };

  const { error } = parsed.data.id
    ? await supabase.from("partners").update(row).eq("id", parsed.data.id)
    : await supabase.from("partners").insert(row);

  if (error) {
    console.error("upsertPartner failed", error);
    return { status: "error", message: "Could not save this partner." };
  }

  revalidatePath("/admin/site-content");
  revalidatePublicPages();
  return { status: "success", message: "Partner saved." };
}

export async function deletePartner(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("partners").delete().eq("id", id);
  if (error) {
    console.error("deletePartner failed", error);
    return { status: "error", message: "Could not delete this partner." };
  }
  revalidatePath("/admin/site-content");
  revalidatePublicPages();
  return { status: "success" };
}

// --- Highlights (moments photos) ----------------------------------------

const highlightSchema = z.object({
  id: z.uuid().optional(),
  src: cloudinaryUrl,
  alt: z.string().trim().min(2).max(200),
  sortOrder: sortOrderField,
});

export async function upsertHighlight(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = highlightSchema.safeParse({
    id: formData.get("id") || undefined,
    src: formData.get("src"),
    alt: formData.get("alt"),
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
    src: parsed.data.src,
    alt: parsed.data.alt,
    sort_order: parsed.data.sortOrder,
  };

  const { error } = parsed.data.id
    ? await supabase.from("highlights").update(row).eq("id", parsed.data.id)
    : await supabase.from("highlights").insert(row);

  if (error) {
    console.error("upsertHighlight failed", error);
    return { status: "error", message: "Could not save this photo." };
  }

  revalidatePath("/admin/site-content");
  revalidatePublicPages();
  return { status: "success", message: "Photo saved." };
}

export async function deleteHighlight(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("highlights").delete().eq("id", id);
  if (error) {
    console.error("deleteHighlight failed", error);
    return { status: "error", message: "Could not delete this photo." };
  }
  revalidatePath("/admin/site-content");
  revalidatePublicPages();
  return { status: "success" };
}

// --- Testimonials (home page reviews widget) ----------------------------

const testimonialSchema = z.object({
  id: z.uuid().optional(),
  studentName: z.string().trim().min(2).max(200),
  quote: z.string().trim().min(2).max(600),
  sortOrder: sortOrderField,
});

export async function upsertTestimonial(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = testimonialSchema.safeParse({
    id: formData.get("id") || undefined,
    studentName: formData.get("studentName"),
    quote: formData.get("quote"),
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
    student_name: parsed.data.studentName,
    quote: parsed.data.quote,
    sort_order: parsed.data.sortOrder,
  };

  const { error } = parsed.data.id
    ? await supabase.from("testimonials").update(row).eq("id", parsed.data.id)
    : await supabase.from("testimonials").insert(row);

  if (error) {
    console.error("upsertTestimonial failed", error);
    return { status: "error", message: "Could not save this review." };
  }

  revalidatePath("/admin/site-content");
  revalidatePublicPages();
  return { status: "success", message: "Review saved." };
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) {
    console.error("deleteTestimonial failed", error);
    return { status: "error", message: "Could not delete this review." };
  }
  revalidatePath("/admin/site-content");
  revalidatePublicPages();
  return { status: "success" };
}

// --- Founder profile (singleton) ----------------------------------------

const founderProfileSchema = z.object({
  name: z.string().trim().min(2).max(200),
  title: z.string().trim().min(2).max(300),
  photoUrl: cloudinaryUrl,
  bio: z.string().trim().min(1).max(4000),
});

export async function updateFounderProfile(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = founderProfileSchema.safeParse({
    name: formData.get("name"),
    title: formData.get("title"),
    photoUrl: formData.get("photoUrl"),
    bio: formData.get("bio"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("founder_profile")
    .update({
      name: parsed.data.name,
      title: parsed.data.title,
      photo_url: parsed.data.photoUrl,
      bio: parsed.data.bio,
    })
    .eq("id", 1);

  if (error) {
    console.error("updateFounderProfile failed", error);
    return { status: "error", message: "Could not save the founder profile." };
  }

  revalidatePath("/admin/site-content");
  revalidatePath("/about");
  return { status: "success", message: "Founder profile saved." };
}

// --- Founder education ----------------------------------------------------

const educationSchema = z.object({
  id: z.uuid().optional(),
  period: z.string().trim().min(1).max(60),
  institution: z.string().trim().min(2).max(200),
  detail: z.string().trim().min(2).max(400),
  sortOrder: sortOrderField,
});

export async function upsertEducation(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = educationSchema.safeParse({
    id: formData.get("id") || undefined,
    period: formData.get("period"),
    institution: formData.get("institution"),
    detail: formData.get("detail"),
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
    period: parsed.data.period,
    institution: parsed.data.institution,
    detail: parsed.data.detail,
    sort_order: parsed.data.sortOrder,
  };

  const { error } = parsed.data.id
    ? await supabase.from("founder_education").update(row).eq("id", parsed.data.id)
    : await supabase.from("founder_education").insert(row);

  if (error) {
    console.error("upsertEducation failed", error);
    return { status: "error", message: "Could not save this education entry." };
  }

  revalidatePath("/admin/site-content");
  revalidatePath("/about");
  return { status: "success", message: "Education entry saved." };
}

export async function deleteEducation(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("founder_education").delete().eq("id", id);
  if (error) {
    console.error("deleteEducation failed", error);
    return { status: "error", message: "Could not delete this education entry." };
  }
  revalidatePath("/admin/site-content");
  revalidatePath("/about");
  return { status: "success" };
}

// --- Founder experience -----------------------------------------------

const experienceSchema = z.object({
  id: z.uuid().optional(),
  period: z.string().trim().min(1).max(60),
  roleTitle: z.string().trim().min(2).max(200),
  org: z.string().trim().min(2).max(200),
  sortOrder: sortOrderField,
});

export async function upsertExperience(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = experienceSchema.safeParse({
    id: formData.get("id") || undefined,
    period: formData.get("period"),
    roleTitle: formData.get("roleTitle"),
    org: formData.get("org"),
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
    period: parsed.data.period,
    role_title: parsed.data.roleTitle,
    org: parsed.data.org,
    sort_order: parsed.data.sortOrder,
  };

  const { error } = parsed.data.id
    ? await supabase.from("founder_experience").update(row).eq("id", parsed.data.id)
    : await supabase.from("founder_experience").insert(row);

  if (error) {
    console.error("upsertExperience failed", error);
    return { status: "error", message: "Could not save this experience entry." };
  }

  revalidatePath("/admin/site-content");
  revalidatePath("/about");
  return { status: "success", message: "Experience entry saved." };
}

export async function deleteExperience(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("founder_experience").delete().eq("id", id);
  if (error) {
    console.error("deleteExperience failed", error);
    return { status: "error", message: "Could not delete this experience entry." };
  }
  revalidatePath("/admin/site-content");
  revalidatePath("/about");
  return { status: "success" };
}

// --- Founder certifications ------------------------------------------

// Badge art and verify links come from whichever issuer hosts them (Credly,
// CertDirectory, Microsoft has neither) - unlike the Cloudinary-only fields
// elsewhere in this file, only "https" is required here.
const httpsUrl = z
  .string()
  .trim()
  .url("Enter a valid URL.")
  .max(500)
  .refine((url) => url.startsWith("https://"), "Must be an HTTPS URL.");

const certificationSchema = z.object({
  id: z.uuid().optional(),
  label: z.string().trim().min(2).max(200),
  provider: z.string().trim().max(200).optional(),
  badgeImageUrl: httpsUrl.optional().or(z.literal("")),
  issuedDate: z.string().trim().optional(),
  expiryDate: z.string().trim().optional(),
  verifyUrl: httpsUrl.optional().or(z.literal("")),
  sortOrder: sortOrderField,
});

export async function upsertCertification(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = certificationSchema.safeParse({
    id: formData.get("id") || undefined,
    label: formData.get("label"),
    provider: formData.get("provider") || undefined,
    badgeImageUrl: formData.get("badgeImageUrl") || undefined,
    issuedDate: formData.get("issuedDate") || undefined,
    expiryDate: formData.get("expiryDate") || undefined,
    verifyUrl: formData.get("verifyUrl") || undefined,
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
    label: parsed.data.label,
    provider: parsed.data.provider || null,
    badge_image_url: parsed.data.badgeImageUrl || null,
    issued_date: parsed.data.issuedDate || null,
    expiry_date: parsed.data.expiryDate || null,
    verify_url: parsed.data.verifyUrl || null,
    sort_order: parsed.data.sortOrder,
  };

  const { error } = parsed.data.id
    ? await supabase.from("founder_certifications").update(row).eq("id", parsed.data.id)
    : await supabase.from("founder_certifications").insert(row);

  if (error) {
    console.error("upsertCertification failed", error);
    return { status: "error", message: "Could not save this certification." };
  }

  revalidatePath("/admin/site-content");
  revalidatePath("/about");
  return { status: "success", message: "Certification saved." };
}

export async function deleteCertification(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("founder_certifications").delete().eq("id", id);
  if (error) {
    console.error("deleteCertification failed", error);
    return { status: "error", message: "Could not delete this certification." };
  }
  revalidatePath("/admin/site-content");
  revalidatePath("/about");
  return { status: "success" };
}
