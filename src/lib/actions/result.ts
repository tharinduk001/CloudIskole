import type { z } from "zod";

/**
 * The single shape every Server Action returns.
 *
 * Actions never throw to the client: an unexpected error becomes a
 * `status: "error"` result with a safe message, so a form can always render
 * something useful and a stack trace never reaches the browser.
 */
export type ActionResult<TData = undefined> =
  | { status: "idle" }
  | { status: "success"; message?: string; data?: TData }
  | {
      status: "error";
      /** Message safe to display to the user. */
      message: string;
      /** Per-field validation messages, keyed by input name. */
      fieldErrors?: Record<string, string>;
    };

export const idleResult: ActionResult<never> = { status: "idle" };

/** Flattens a ZodError into the `fieldErrors` shape used by forms. */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    // Keep the first message per field — showing three errors under one input
    // is noise, not help.
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Maps a Supabase auth error to a message worth showing a student.
 *
 * Supabase messages are developer-facing ("Invalid login credentials",
 * "Token has expired or is invalid") and some leak account existence. This
 * translates the ones we expect and falls back to something neutral.
 */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("expired") || m.includes("invalid") || m.includes("token")) {
    return "That code is wrong or has expired. Request a new one.";
  }
  if (m.includes("rate") || m.includes("too many") || m.includes("seconds")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (m.includes("email") && m.includes("valid")) {
    return "That email address does not look right.";
  }
  return "Something went wrong on our side. Please try again in a moment.";
}
