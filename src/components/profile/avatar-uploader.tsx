"use client";

import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useActionState } from "react";

import { setAvatarUrl } from "@/lib/profile/actions";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/**
 * Uploads directly from the browser to the `avatars` bucket, then calls a
 * server action to persist the resulting URL onto the profile row.
 *
 * The upload bypasses our server entirely — Supabase Storage's own RLS policy
 * ("avatars: owner writes own folder") is the authority on whether this
 * upload is allowed, keyed on the folder prefix matching the caller's user
 * id. This keeps a 2MB image off our server's request path altogether.
 */
export function AvatarUploader({
  userId,
  fullName,
  currentAvatarUrl,
}: {
  userId: string;
  fullName: string;
  currentAvatarUrl: string | null;
}) {
  const [state, action, pending] = useActionState(setAvatarUrl, {
    status: "idle" as const,
  });
  const [preview, setPreview] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Please choose a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That image is larger than 2MB. Please choose a smaller one.");
      return;
    }

    setUploading(true);
    setPreview(URL.createObjectURL(file));

    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    setUploading(false);

    if (uploadError) {
      setError("Upload failed. Please try again.");
      return;
    }

    // Hand off to the server action via a hidden field + programmatic submit,
    // keeping one `useActionState` as the single source of pending/error UI
    // for the "persist to profile" half of this flow.
    const hidden = formRef.current?.elements.namedItem("path") as HTMLInputElement | null;
    if (hidden) hidden.value = path;
    formRef.current?.requestSubmit();
  }

  const displayUrl = preview ?? currentAvatarUrl;
  const busy = uploading || pending;

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt=""
            width={72}
            height={72}
            unoptimized
            className="size-18 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-18 place-items-center rounded-full bg-teal-600 text-xl font-semibold text-white">
            {initials(fullName)}
          </span>
        )}
        {busy ? (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40">
            <Loader2 className="size-5 animate-spin text-white" aria-hidden="true" />
          </span>
        ) : null}
      </div>

      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="border-line-strong text-ink inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50"
        >
          <Camera className="size-4" aria-hidden="true" />
          Change photo
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={onFileChange}
        />
        <p className="text-ink-subtle mt-1.5 text-xs">JPG, PNG or WEBP. Max 2MB.</p>
        {error ? (
          <p role="alert" className="text-danger mt-1 text-xs">
            {error}
          </p>
        ) : null}
        {state.status === "error" ? (
          <p role="alert" className="text-danger mt-1 text-xs">
            {state.message}
          </p>
        ) : null}
      </div>

      <form ref={formRef} action={action} className="hidden">
        <input type="hidden" name="path" />
      </form>
    </div>
  );
}
