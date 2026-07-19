import type { Metadata } from "next";

import { ComingSoon } from "@/components/site/coming-soon";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Cloud, DevOps, Linux and Software Engineering courses built for Sri Lankan students after A/Ls. Free and paid tracks, priced in rupees.",
};

export default function CoursesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Courses"
        description="Free and paid tracks in Cloud, DevOps, Linux and Software Engineering — each one built to take you from zero to job-ready."
      />
      <ComingSoon
        feature="The course catalogue"
        detail="We are finishing the first four tracks now. Create a free account and you will be the first to know the moment enrollment opens."
      />
    </>
  );
}
