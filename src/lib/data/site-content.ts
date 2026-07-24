import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Partner = Database["public"]["Tables"]["partners"]["Row"];
export type Highlight = Database["public"]["Tables"]["highlights"]["Row"];
export type Testimonial = Database["public"]["Tables"]["testimonials"]["Row"];
export type FounderEducation = Database["public"]["Tables"]["founder_education"]["Row"];
export type FounderExperience = Database["public"]["Tables"]["founder_experience"]["Row"];
export type FounderCertification =
  Database["public"]["Tables"]["founder_certifications"]["Row"];

export type FounderProfile = Database["public"]["Tables"]["founder_profile"]["Row"] & {
  education: FounderEducation[];
  experience: FounderExperience[];
  certifications: FounderCertification[];
};

/**
 * Public marketing content — partners, moments photos, founder bio. Every
 * table here carries a plain "anyone reads" RLS policy (see
 * 20260719001800_site_content.sql), so this reads as the visitor with no
 * admin distinction: there is no draft/published state to filter on, unlike
 * courses or sessions.
 */
export async function getPartners(): Promise<Partner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to load partners: ${error.message}`);
  return data;
}

export async function getHighlights(): Promise<Highlight[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("highlights")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to load highlights: ${error.message}`);
  return data;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to load testimonials: ${error.message}`);
  return data;
}

export async function getFounderProfile(): Promise<FounderProfile> {
  const supabase = await createClient();

  const [profile, education, experience, certifications] = await Promise.all([
    supabase.from("founder_profile").select("*").eq("id", 1).single(),
    supabase
      .from("founder_education")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("founder_experience")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("founder_certifications")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  if (profile.error) {
    throw new Error(`Failed to load founder profile: ${profile.error.message}`);
  }
  if (education.error) {
    throw new Error(`Failed to load founder education: ${education.error.message}`);
  }
  if (experience.error) {
    throw new Error(`Failed to load founder experience: ${experience.error.message}`);
  }
  if (certifications.error) {
    throw new Error(
      `Failed to load founder certifications: ${certifications.error.message}`,
    );
  }

  return {
    ...profile.data,
    education: education.data,
    experience: experience.data,
    certifications: certifications.data,
  };
}
