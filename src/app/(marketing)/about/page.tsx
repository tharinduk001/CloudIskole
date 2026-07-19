import { Compass, HeartHandshake, Scale, Sprout } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/site/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Why CloudIskole exists: affordable, practical Cloud and DevOps education built specifically for Sri Lankan students after their A/Ls.",
};

const values = [
  {
    icon: Scale,
    title: "Priced for students here",
    description:
      "Our fees are set in rupees against what a Sri Lankan student can actually afford — never converted from a dollar price built for another market.",
  },
  {
    icon: Compass,
    title: "Only what gets you hired",
    description:
      "We read local job postings and teach the tools they name. No filler modules, no badges for skills nobody is recruiting for.",
  },
  {
    icon: Sprout,
    title: "Genuinely beginner-first",
    description:
      "Every track assumes you have never used a terminal. We explain the thing before we use the word for the thing.",
  },
  {
    icon: HeartHandshake,
    title: "Honest about outcomes",
    description:
      "We will not promise you a job. We will give you real skills, real projects and badges you can show an employer.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About us"
        title="The gap we exist to close"
        description="Every year thousands of Sri Lankan students finish their A/Ls and wait. We think that waiting year should be the year your career starts."
      />

      <Section>
        <Container size="narrow">
          <div className="measure text-ink-muted mx-auto flex flex-col gap-5 text-base leading-relaxed">
            <p>
              After A/Ls, most Sri Lankan students face a gap of twelve to eighteen months
              before university placement — and for many, a place never comes at all. That
              time is usually spent waiting rather than building.
            </p>
            <p>
              Meanwhile, the local tech industry has a genuine shortage of Cloud and
              DevOps engineers. These are among the best-paid entry points into the field,
              and unlike many careers, they do not require a degree to begin — they
              require demonstrable skill.
            </p>
            <p>
              The problem is access. International platforms price their courses in
              dollars and assume background knowledge that A/L students have not been
              given. Local institutes are expensive and largely confined to Colombo.
              Neither is built for a student in Matara or Vavuniya with a laptop and a
              year to spare.
            </p>
            <p className="text-ink font-medium">
              {brand.name} is built for exactly that student: practical Cloud, DevOps and
              Software Engineering training that is affordable, online, and designed from
              the ground up for Sri Lankans starting from zero.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="border-line bg-surface border-y">
        <Container size="wide">
          <SectionHeading
            eyebrow="What we stand for"
            title="Four commitments we hold ourselves to"
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {values.map((value) => (
              <Card key={value.title} className="p-7">
                <span className="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-600">
                  <value.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display mt-5 text-lg font-semibold">{value.title}</h3>
                <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                  {value.description}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container size="narrow">
          <div className="text-center">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Want to talk to us?
            </h2>
            <p className="text-ink-muted mx-auto mt-4 max-w-xl text-base leading-relaxed">
              Whether you are a student deciding where to start, or an employer looking
              for trained juniors, we would like to hear from you.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Contact us</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/courses">Browse courses</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
