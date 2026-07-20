import type { Metadata } from "next";

import { SessionCard } from "@/components/sessions/session-card";
import { PageHeader } from "@/components/site/page-header";
import { Container, Section } from "@/components/ui/layout";
import { listSessions, type SessionSummary } from "@/lib/data/sessions";

export const metadata: Metadata = {
  title: "Live sessions",
  description:
    "Join live online Cloud and DevOps classes with CloudIskole. Register for upcoming sessions and catch recordings of past ones.",
};

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
      <h2 className="font-display text-onyx text-xl font-semibold">{title}</h2>
      {sessions.length === 0 ? (
        <p className="text-mist mt-3 text-sm">{empty}</p>
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
