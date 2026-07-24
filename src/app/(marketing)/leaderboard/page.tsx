import type { Metadata } from "next";

import { LeaderboardTabs } from "@/components/gamification/leaderboard-tabs";
import { PageHeader } from "@/components/site/page-header";
import { Container, Section } from "@/components/ui/layout";
import { getOptionalProfile } from "@/lib/data/auth";
import { listLeaderboard } from "@/lib/data/gamification";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "See the top CloudIskole learners by CloudCoins earned from lessons, quizzes and live sessions.",
};

export default async function LeaderboardPage() {
  const [allTime, monthly, profile] = await Promise.all([
    listLeaderboard("all_time"),
    listLeaderboard("monthly"),
    getOptionalProfile(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Compete"
        title="Leaderboard"
        description="Earn CloudCoins for finishing lessons, passing quizzes and attending sessions - then see where you stand. Appearing publicly is always your choice, from your profile."
      />

      <Section>
        <Container size="narrow">
          <LeaderboardTabs allTime={allTime} monthly={monthly} meId={profile?.id} />
        </Container>
      </Section>
    </>
  );
}
