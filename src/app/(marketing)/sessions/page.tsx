import type { Metadata } from "next";

import { ComingSoon } from "@/components/site/coming-soon";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = {
  title: "Live sessions",
  description:
    "Join live online Cloud and DevOps classes with CloudIskole. Register for upcoming sessions and catch recordings of past ones.",
};

export default function SessionsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Live learning"
        title="Sessions"
        description="Live online classes you can join from anywhere in Sri Lanka. Ask questions in real time, or watch the recording later if you miss one."
      />
      <ComingSoon
        feature="Live sessions"
        detail="Our first session schedule is being finalised. Sign up free and we will send you the dates by SMS and email."
      />
    </>
  );
}
