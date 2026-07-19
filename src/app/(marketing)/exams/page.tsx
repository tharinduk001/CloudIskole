import type { Metadata } from "next";

import { ComingSoon } from "@/components/site/coming-soon";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = {
  title: "Practice exams",
  description:
    "Timed MCQ practice exams in Cloud, DevOps and Linux with instant marking, answer explanations and rankings.",
};

export default function ExamsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Test yourself"
        title="Practice exams"
        description="Timed multiple-choice exams with instant marking, explanations for every answer, and a ranking against other students."
      />
      <ComingSoon
        feature="Practice exams"
        detail="The exam engine is in development. Create your free account now so your attempts and scores are saved from day one."
      />
    </>
  );
}
