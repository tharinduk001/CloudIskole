import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/**
 * The Data Access Layer.
 *
 * `proxy.ts` performs an optimistic redirect for a nicer experience, but it is
 * explicitly not the authorisation boundary — Next.js documents proxy as
 * unsuitable for that. These functions are the boundary: every page or action
 * that needs a user calls one of them, and each one re-verifies against the
 * auth server rather than trusting a cookie or a prop passed down.
 */

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  phone_verified_at: string | null;
  role: "student" | "admin";
  leaderboard_opt_in: boolean;
  marketing_opt_in: boolean;
  created_at: string;
};

const PROFILE_COLUMNS =
  "id, email, full_name, avatar_url, phone, phone_verified_at, role, leaderboard_opt_in, marketing_opt_in, created_at";

/**
 * The verified current user, or a redirect to sign-in.
 *
 * @param next path to return to after signing in.
 */
export async function requireUser(next = "/dashboard"): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  }

  return user;
}

/** The signed-in user's profile row, or a redirect to sign-in. */
export async function requireProfile(next = "/dashboard"): Promise<Profile> {
  const user = await requireUser(next);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .single();

  if (error || !data) {
    // The signup trigger creates this row, so its absence means something is
    // genuinely wrong — fail loudly rather than rendering a broken page.
    throw new Error(
      `Profile missing for user ${user.id}. The signup trigger may not have run.`,
    );
  }

  return data as Profile;
}

/**
 * Admin gate for `/admin` pages and privileged actions.
 *
 * Re-reads the role from the database on every call. It is never taken from
 * the JWT, a cookie, or a value passed in by the caller.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile("/admin");

  if (profile.role !== "admin") {
    // Not "forbidden" — a non-admin should not learn that /admin exists.
    redirect("/dashboard");
  }

  return profile;
}

/** The profile if signed in, otherwise null. Never redirects. */
export async function getOptionalProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .single();

  return (data as Profile | null) ?? null;
}
