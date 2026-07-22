import {
  BadgeCheck,
  Briefcase,
  Compass,
  GraduationCap,
  HeartHandshake,
  Scale,
  Sprout,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PageHeader } from "@/components/site/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { founder } from "@/content/founder";
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
      "Our fees are set in rupees against what a Sri Lankan student can actually afford - never converted from a dollar price built for another market.",
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
          <div className="measure text-mist mx-auto flex flex-col gap-5 text-base leading-relaxed">
            <p>
              After A/Ls, most Sri Lankan students face a gap of twelve to eighteen months
              before university placement - and for many, a place never comes at all. That
              time is usually spent waiting rather than building.
            </p>
            <p>
              Meanwhile, the local tech industry has a genuine shortage of Cloud and
              DevOps engineers. These are among the best-paid entry points into the field,
              and unlike many careers, they do not require a degree to begin - they
              require demonstrable skill.
            </p>
            <p>
              The problem is access. International platforms price their courses in
              dollars and assume background knowledge that A/L students have not been
              given. Local institutes are expensive and largely confined to Colombo.
              Neither is built for a student in Matara or Vavuniya with a laptop and a
              year to spare.
            </p>
            <p className="text-onyx font-medium">
              {brand.name} is built for exactly that student: practical Cloud, DevOps and
              Software Engineering training that is affordable, online, and designed from
              the ground up for Sri Lankans starting from zero.
            </p>
          </div>
        </Container>
      </Section>

      <FounderSection />

      <Section className="border-hairline bg-surface border-y">
        <Container size="wide">
          <SectionHeading
            size="xl"
            eyebrow="What we stand for"
            title="Four commitments we hold ourselves to"
            eyebrowClassName="text-terracotta-600"
            titleClassName="text-onyx"
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {values.map((value) => (
              <Card key={value.title} className="border-hairline rounded-none p-7">
                <span className="bg-terracotta-50 text-terracotta-600 grid size-11 place-items-center rounded-none">
                  <value.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display text-onyx mt-5 text-lg font-semibold">
                  {value.title}
                </h3>
                <p className="text-mist mt-2 text-sm leading-relaxed">
                  {value.description}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-cream">
        <Container size="narrow">
          <div className="text-center">
            <h2 className="font-display text-onyx text-2xl font-semibold sm:text-3xl">
              Want to talk to us?
            </h2>
            <p className="text-mist mx-auto mt-4 max-w-xl text-base leading-relaxed">
              Whether you are a student deciding where to start, or an employer looking
              for trained juniors, we would like to hear from you.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-terracotta-600 hover:bg-terracotta-700 rounded-none"
              >
                <Link href="/contact">Contact us</Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="border-onyx text-onyx hover:bg-onyx rounded-none hover:text-white"
              >
                <Link href="/courses">Browse courses</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function FounderSection() {
  return (
    <Section className="bg-cream">
      <Container size="wide">
        <SectionHeading
          size="xl"
          eyebrow="About the founder"
          title="Built by someone who's spent years in the classroom"
          eyebrowClassName="text-terracotta-600"
          titleClassName="text-onyx"
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <div>
            <div className="border-hairline relative aspect-[4/5] w-full max-w-sm overflow-hidden border">
              <Image
                src={founder.photo}
                alt={founder.name}
                fill
                sizes="(min-width: 1024px) 24rem, 100vw"
                className="object-cover"
              />
            </div>
            <h3 className="font-display text-onyx mt-6 text-xl font-semibold">
              {founder.name}
            </h3>
            <p className="text-mist mt-1 text-sm leading-relaxed">{founder.title}</p>
          </div>

          <div className="flex flex-col gap-10">
            <div className="measure text-mist flex flex-col gap-5 text-base leading-relaxed">
              {founder.bio.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <div className="flex items-center gap-2">
                  <GraduationCap
                    className="text-terracotta-600 size-4"
                    aria-hidden="true"
                  />
                  <h4 className="text-onyx text-sm font-semibold tracking-wide uppercase">
                    Education
                  </h4>
                </div>
                <ul className="border-hairline mt-4 flex flex-col gap-4 border-l pl-4">
                  {founder.education.map((entry) => (
                    <li key={entry.institution}>
                      <p className="text-mist-soft text-xs">{entry.period}</p>
                      <p className="text-onyx mt-0.5 text-sm font-medium">
                        {entry.institution}
                      </p>
                      <p className="text-mist mt-0.5 text-sm">{entry.detail}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Briefcase className="text-terracotta-600 size-4" aria-hidden="true" />
                  <h4 className="text-onyx text-sm font-semibold tracking-wide uppercase">
                    Experience
                  </h4>
                </div>
                <ul className="border-hairline mt-4 flex flex-col gap-4 border-l pl-4">
                  {founder.experience.map((entry) => (
                    <li key={`${entry.role}-${entry.org}`}>
                      <p className="text-mist-soft text-xs">{entry.period}</p>
                      <p className="text-onyx mt-0.5 text-sm font-medium">{entry.role}</p>
                      <p className="text-mist mt-0.5 text-sm">{entry.org}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="text-terracotta-600 size-4" aria-hidden="true" />
                <h4 className="text-onyx text-sm font-semibold tracking-wide uppercase">
                  Certifications
                </h4>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {founder.certifications.map((cert) => (
                  <Badge
                    key={cert}
                    className="border-terracotta-400/40 bg-terracotta-50 text-terracotta-600 rounded-none border"
                  >
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
