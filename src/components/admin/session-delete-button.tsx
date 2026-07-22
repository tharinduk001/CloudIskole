"use client";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { deleteSession } from "@/lib/admin/sessions-actions";

export function SessionDeleteButton({
  sessionId,
  title,
}: {
  sessionId: string;
  title: string;
}) {
  return (
    <ConfirmDeleteButton
      label="Delete session"
      confirmMessage={`Delete "${title}"? This cannot be undone.`}
      onDelete={() => deleteSession(sessionId)}
    />
  );
}
