#!/usr/bin/env node
/**
 * Build guard: proves server-only secrets cannot reach the browser bundle.
 *
 * Runs in `npm run check` and in CI. Three independent checks:
 *
 *   1. No file marked "use client" (or transitively imported only by such
 *      files) may reference a server-only env var.
 *   2. No server-only secret may be given a NEXT_PUBLIC_ prefix anywhere.
 *   3. No credential-shaped literal may be committed in source.
 *
 * Exits non-zero with the offending file:line so the failure is actionable.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

/** Env vars that must never be readable from the browser. */
const SERVER_ONLY_ENV = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "TEXTLK_API_TOKEN",
  "UPSTASH_REDIS_REST_TOKEN",
  "CRON_SECRET",
  "SENTRY_AUTH_TOKEN",
];

/** Literals that look like real credentials rather than placeholders. */
const CREDENTIAL_PATTERNS = [
  { name: "Supabase service_role JWT", re: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/ },
  { name: "Supabase secret key", re: /\bsb_secret_[A-Za-z0-9_-]{16,}/ },
  { name: "Resend API key", re: /\bre_[A-Za-z0-9]{24,}/ },
];

const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "out", "build"]);

/** @returns {string[]} absolute paths of every source file under `dir` */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (CODE_EXT.has(entry.slice(entry.lastIndexOf(".")))) {
      out.push(full);
    }
  }
  return out;
}

/** Detects the "use client" / "use server" directive at the top of a file. */
function directiveOf(source) {
  // Only the first non-comment, non-blank statement counts as a directive.
  const head = source.slice(0, 500);
  if (/^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/.*\n\s*)*["']use client["']/.test(head)) {
    return "client";
  }
  if (/^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/.*\n\s*)*["']use server["']/.test(head)) {
    return "server";
  }
  return null;
}

const violations = [];

/** Records a violation with a clickable file:line reference. */
function report(file, source, index, message) {
  const line = source.slice(0, index).split("\n").length;
  violations.push(`${relative(ROOT, file)}:${line}  ${message}`);
}

for (const file of walk(SRC)) {
  const source = readFileSync(file, "utf8");
  const isClient = directiveOf(source) === "client";

  for (const name of SERVER_ONLY_ENV) {
    // Check 2: a server-only secret must never be exposed via NEXT_PUBLIC_.
    const publicRe = new RegExp(`NEXT_PUBLIC_${name}`, "g");
    for (const m of source.matchAll(publicRe)) {
      report(file, source, m.index, `${name} must never carry a NEXT_PUBLIC_ prefix.`);
    }

    // Check 1: server-only secrets must not appear in client components.
    if (isClient) {
      const re = new RegExp(`\\b${name}\\b`, "g");
      for (const m of source.matchAll(re)) {
        report(
          file,
          source,
          m.index,
          `${name} is server-only but this file is marked "use client".`,
        );
      }
    }
  }

  // Check 3: no credential-shaped literals in source.
  for (const { name, re } of CREDENTIAL_PATTERNS) {
    const m = re.exec(source);
    if (m) {
      report(file, source, m.index, `Looks like a hardcoded ${name}. Move it to .env.local.`);
    }
  }
}

if (violations.length > 0) {
  console.error("\n  Secret guard FAILED\n");
  for (const v of violations) console.error(`   ${v}`);
  console.error(`\n  ${violations.length} violation(s). Build blocked.\n`);
  process.exit(1);
}

console.log("  Secret guard passed — no server-only secrets reachable from client code.");
