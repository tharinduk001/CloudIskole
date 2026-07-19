import { Calendar, Radio, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/site/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { listSessions, type SessionSummary } from "@/lib/data/sessions";

export const metadata: Metadata = {
  title: "Live sessions",
  description:
    "Join live online Cloud and DevOps classes with CloudIskole. Register for upcoming sessions and catch recordings of past ones.",
};

const dateFormatter = new Intl.DateTimeFormat("en-LK", {
  timeZone: "Asia/Colombo",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

function SessionCard({ session }: { session: SessionSummary }) {
  const seatsLeft =
    session.capacity != null
      ? Math.max(session.capacity - (session.registered_count ?? 0), 0)
      : null;

  return (
    <Link key={session.id} href={`/sessions/${session.slug}`}>
      <Card interactive className="flex h-full flex-col p-6">
        <div className="flex items-center gap-2">
          {session.status === "live" ? (
            <Badge variant="danger" size="sm">
              <Radio aria-hidden="true" />
              Live now
            </Badge>
          ) : null}
          <Badge variant={session.is_free ? "success" : "gold"} size="sm">
            {session.is_free ? "Free" : "Paid"}
          </Badge>
        </div>
        <h2 className="font-display mt-3 text-lg font-semibold">{session.title}</h2>
        {session.description ? (
          <p className="text-ink-muted mt-2 line-clamp-2 text-sm leading-relaxed">
            {session.description}
          </p>
        ) : null}
        <div className="text-ink-subtle mt-auto flex flex-wrap items-center gap-4 pt-5 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5" aria-hidden="true" />
            {dateFormatter.format(new Date(session.starts_at))}
          </span>
          {seatsLeft !== null && session.status === "upcoming" ? (
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" aria-hidden="true" />
              {seatsLeft > 0 ? `${seatsLeft} seats left` : "Full"}
            </span>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}

function SessionGroup({
  title,
  sessions,
  empty,
}: {
  title: string;
  sessions: SessionSummary[];
  empty: string;
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {sessions.length === 0 ? (
        <p className="text-ink-muted mt-3 text-sm">{empty}</p>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}

export default async function SessionsPage() {
  const { live, upcoming, completed } = await listSessions();

  return (
    <>
      <PageHeader
        eyebrow="Live learning"
        title="Sessions"
        description="Live online classes you can join from anywhere in Sri Lanka. Ask questions in real time, or watch the recording later if you miss one. Times shown in Colombo time."
      />

      <Section>
        <Container size="wide" className="flex flex-col gap-12">
          {live.length > 0 ? (
            <SessionGroup title="Live now" sessions={live} empty="" />
          ) : null}
          <SessionGroup
            title="Upcoming"
            sessions={upcoming}
            empty="No sessions are scheduled yet — check back soon."
          />
          <SessionGroup
            title="Completed"
            sessions={completed}
            empty="No past sessions yet."
          />
        </Container>
      </Section>
    </>
  );
}
