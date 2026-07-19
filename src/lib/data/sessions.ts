import "server-only";

import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type SessionPublicRow = Database["public"]["Views"]["sessions_public"]["Row"];
export type SessionRegistrationRow = Database["public"]["Tables"]["session_registrations"]["Row"];

/**
 * `sessions_public`'s generated Row type marks every column nullable —
 * Postgres/PostgREST don't propagate the base table's NOT NULL constraints
 * through a view. This narrows it back to what the columns actually
 * guarantee (id/slug/title/starts_at/duration_minutes/is_free/status/
 * created_at all come from NOT NULL columns on `sessions`), so callers don't
 * have to null-check fields that can never be null.
 */
export type SessionSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_path: string | null;
  starts_at: string;
  duration_minutes: number;
  host_name: string | null;
  capacity: number | null;
  is_free: boolean;
  course_id: string | null;
  status: Database["public"]["Enums"]["session_status"];
  recording_url: string | null;
  created_at: string;
  registered_count: number;
};

function toSessionSummary(row: SessionPublicRow): SessionSummary {
  return {
    id: row.id!,
    slug: row.slug!,
    title: row.title!,
    description: row.description,
    cover_image_path: row.cover_image_path,
    starts_at: row.starts_at!,
    duration_minutes: row.duration_minutes!,
    host_name: row.host_name,
    capacity: row.capacity,
    is_free: row.is_free!,
    course_id: row.course_id,
    status: row.status!,
    recording_url: row.recording_url,
    created_at: row.created_at!,
    registered_count: row.registered_count ?? 0,
  };
}

/** Every non-cancelled session, grouped by status for the three-column listing. */
export async function listSessions(): Promise<{
  live: SessionSummary[];
  upcoming: SessionSummary[];
  completed: SessionSummary[];
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions_public")
    .select("*")
    .order("starts_at", { ascending: true });

  if (error) throw new Error(`Failed to load sessions: ${error.message}`);

  const rows = (data ?? []).map(toSessionSummary);
  return {
    live: rows.filter((s) => s.status === "live"),
    upcoming: rows.filter((s) => s.status === "upcoming"),
    completed: rows.filter((s) => s.status === "completed").reverse(),
  };
}

export async function getSessionBySlug(slug: string): Promise<SessionSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("sessions_public").select("*").eq("slug", slug).maybeSingle();

  if (error || !data) notFound();
  return toSessionSummary(data);
}

/** The signed-in student's own registration for a session, or null. */
export async function getMyRegistration(sessionId: string): Promise<SessionRegistrationRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("session_registrations")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}

/**
 * The signed-in student's registrations, joined with session details.
 *
 * Two queries rather than an embedded `session:sessions(...)` select: the
 * base `sessions` table has no SELECT grant for `authenticated` on
 * `join_url`-adjacent reads to worry about here, but PostgREST embedding
 * would still resolve through the base table, not `sessions_public` — so
 * this fetches registrations, then looks the sessions up through the view.
 */
export async function listMyRegistrations(
  limit = 20,
): Promise<{ registration: SessionRegistrationRow; session: SessionSummary }[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: registrations, error } = await supabase
    .from("session_registrations")
    .select("*")
    .eq("user_id", user.id)
    .order("registered_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load your sessions: ${error.message}`);
  if (!registrations || registrations.length === 0) return [];

  const sessionIds = registrations.map((r) => r.session_id);
  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions_public")
    .select("*")
    .in("id", sessionIds);

  if (sessionsError) throw new Error(`Failed to load your sessions: ${sessionsError.message}`);

  const bySessionId = new Map((sessions ?? []).map(toSessionSummary).map((s) => [s.id, s]));
  return registrations
    .map((registration) => {
      const session = bySessionId.get(registration.session_id);
      return session ? { registration, session } : null;
    })
    .filter((row): row is { registration: SessionRegistrationRow; session: SessionSummary } => row !== null);
}

/**
 * The private join link, via `get_session_join_url()`. Returns null both
 * when the caller isn't registered (the RPC throws, caught here) and when
 * it's simply too early — the UI treats both the same: no link yet.
 */
export async function getJoinUrl(sessionId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_session_join_url", { p_session_id: sessionId });
  if (error) return null;
  return data;
}
