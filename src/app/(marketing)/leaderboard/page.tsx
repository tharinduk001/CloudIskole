import type { Metadata } from "next";

import { ComingSoon } from "@/components/site/coming-soon";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "See the top CloudIskole learners by XP earned from lessons, quizzes and live sessions.",
};

export default function LeaderboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Compete"
        title="Leaderboard"
        description="Earn XP for finishing lessons, passing quizzes and attending sessions — then see where you stand. Appearing publicly is always your choice."
      />
      <ComingSoon
        feature="The leaderboard"
        detail="Rankings open once the first courses and exams go live. Your XP starts counting from your very first lesson."
      />
    </>
  );
}
