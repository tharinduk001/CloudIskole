import { Clock, ExternalLink, Radio, User, Users } from "lucide-react";
import type { Metadata } from "next";

import { RegistrationControls } from "@/components/sessions/registration-controls";
import { Badge } from "@/components/ui/badge";
import { Container, Section } from "@/components/ui/layout";
import { getOptionalProfile } from "@/lib/data/auth";
import { getJoinUrl, getMyRegistration, getSessionBySlug } from "@/lib/data/sessions";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const session = await getSessionBySlug(slug);
  return { title: session.title, description: session.description ?? undefined };
}

const dateFormatter = new Intl.DateTimeFormat("en-LK", {
  timeZone: "Asia/Colombo",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSessionBySlug(slug);
  const profile = await getOptionalProfile();
  const registration = profile ? await getMyRegistration(session.id) : null;
  const joinUrl = profile ? await getJoinUrl(session.id) : null;

  const seatsLeft =
    session.capacity != null
      ? Math.max(session.capacity - (session.registered_count ?? 0), 0)
      : null;
  const isFull = seatsLeft !== null && seatsLeft <= 0;

  return (
    <Section className="py-10 sm:py-16">
      <Container size="narrow" className="max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {session.status === "live" ? (
            <Badge className="bg-terracotta-600 rounded-none border-0 text-white" size="sm">
              <Radio aria-hidden="true" />
              Live now
            </Badge>
          ) : null}
          {session.status === "completed" ? (
            <Badge className="bg-hairline/60 text-onyx-soft rounded-none border-0" size="sm">
              Completed
            </Badge>
          ) : null}
          <Badge
            className={cn(
              "rounded-none border-0",
              session.is_free ? "bg-mint-500/15 text-mint-500" : "bg-onyx/10 text-onyx",
            )}
            size="sm"
          >
            {session.is_free ? "Free" : "Paid"}
          </Badge>
        </div>

        <h1 className="font-display text-onyx mt-3 text-3xl font-semibold">
          {session.title}
        </h1>
        {session.description ? (
          <p className="text-mist mt-3 text-base leading-relaxed">
            {session.description}
          </p>
        ) : null}

        <div className="text-mist-soft mt-5 flex flex-wrap items-center gap-5 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden="true" />
            {dateFormatter.format(new Date(session.starts_at))} (Colombo time)
          </span>
          {session.host_name ? (
            <span className="inline-flex items-center gap-1.5">
              <User className="size-4" aria-hidden="true" />
              {session.host_name}
            </span>
          ) : null}
          {seatsLeft !== null && session.status === "upcoming" ? (
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4" aria-hidden="true" />
              {isFull ? "Full" : `${seatsLeft} seats left`}
            </span>
          ) : null}
        </div>

        <div className="mt-8">
          {session.status === "completed" ? (
            session.recording_url ? (
              <a
                href={session.recording_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-terracotta-600 hover:underline"
              >
                Watch the recording
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            ) : (
              <p className="text-mist text-sm">
                No recording has been posted for this session.
              </p>
            )
          ) : (
            <RegistrationControls
              sessionId={session.id}
              sessionSlug={session.slug}
              isRegistered={registration !== null}
              isFull={isFull}
              isOpen={session.status === "upcoming"}
              joinUrl={joinUrl}
              signedIn={profile !== null}
            />
          )}
        </div>
      </Container>
    </Section>
  );
}
