"use client";

import { CalendarCheck, Loader2, LogIn, Video, XCircle } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { idleResult } from "@/lib/actions/result";
import { cancelRegistration, registerForSession } from "@/lib/sessions/actions";

/** Register / cancel / join, whichever applies. Session status + registration state decide which. */
export function RegistrationControls({
  sessionId,
  sessionSlug,
  isRegistered,
  isFull,
  isOpen,
  joinUrl,
  signedIn,
}: {
  sessionId: string;
  sessionSlug: string;
  isRegistered: boolean;
  isFull: boolean;
  isOpen: boolean;
  joinUrl: string | null;
  signedIn: boolean;
}) {
  const [registerState, registerAction, registerPending] = useActionState(
    registerForSession,
    idleResult,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelRegistration,
    idleResult,
  );

  if (!signedIn) {
    return (
      <div className="flex flex-col gap-2 sm:items-start">
        <Button asChild size="lg">
          <a href={`/sign-in?next=${encodeURIComponent(`/sessions/${sessionSlug}`)}`}>
            <LogIn aria-hidden="true" />
            Sign in to register
          </a>
        </Button>
      </div>
    );
  }

  if (joinUrl) {
    return (
      <Button asChild size="lg">
        <a href={joinUrl} target="_blank" rel="noopener noreferrer">
          <Video aria-hidden="true" />
          Join now
        </a>
      </Button>
    );
  }

  if (isRegistered) {
    return (
      <form action={cancelAction} className="flex flex-col gap-2 sm:items-start">
        <input type="hidden" name="sessionId" value={sessionId} />
        <div className="text-success inline-flex items-center gap-1.5 text-sm font-medium">
          <CalendarCheck className="size-4" aria-hidden="true" />
          You&rsquo;re registered
          {isOpen ? (
            <span className="text-ink-subtle font-normal">
              — the join link appears shortly before start
            </span>
          ) : null}
        </div>
        {isOpen ? (
          <Button type="submit" variant="secondary" size="sm" disabled={cancelPending}>
            {cancelPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <XCircle aria-hidden="true" />
            )}
            Cancel registration
          </Button>
        ) : null}
        {cancelState.status === "error" ? (
          <p role="alert" className="text-danger text-xs">
            {cancelState.message}
          </p>
        ) : null}
      </form>
    );
  }

  if (!isOpen) {
    return (
      <p className="text-ink-muted text-sm">Registration is closed for this session.</p>
    );
  }

  if (isFull) {
    return <p className="text-ink-muted text-sm">This session is full.</p>;
  }

  return (
    <form action={registerAction} className="flex flex-col gap-2 sm:items-start">
      <input type="hidden" name="sessionId" value={sessionId} />
      <Button
        type="submit"
        size="lg"
        disabled={registerPending}
        className="w-full sm:w-auto"
      >
        {registerPending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <CalendarCheck aria-hidden="true" />
        )}
        Register
      </Button>
      {registerState.status === "error" ? (
        <p role="alert" className="text-danger text-xs">
          {registerState.message}
        </p>
      ) : null}
    </form>
  );
}
