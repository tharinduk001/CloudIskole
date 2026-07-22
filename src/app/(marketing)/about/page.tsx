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

import { Liyawel } from "@/components/brand/liyawel";
import { Logo } from "@/components/brand/logo";
import { PageHeader } from "@/components/site/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { brand } from "@/lib/brand";
import { getFounderProfile, type FounderProfile } from "@/lib/data/site-content";

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

export default async function AboutPage() {
  const founder = await getFounderProfile();

  return (
    <>
      <PageHeader
        eyebrow="About us"
        title="The gap we exist to close"
        description="Every year thousands of Sri Lankan students finish their A/Ls and wait. We think that waiting year should be the year your career starts."
      />

      <Section>
        <Container size="wide">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-center lg:gap-16">
            <div className="border-hairline bg-mural-wash relative flex aspect-[4/3] items-center justify-center overflow-hidden border lg:aspect-square">
              <Liyawel
                strokeClassName="stroke-terracotta-400"
                className="absolute inset-0 m-auto size-2/3 opacity-40"
              />
              <Logo className="relative text-4xl sm:text-5xl" />
            </div>

            <div className="measure text-mist flex flex-col gap-5 text-base leading-relaxed">
              <p>
                After A/Ls, most Sri Lankan students face a gap of twelve to eighteen
                months before university placement - and for many, a place never comes at
                all. That time is usually spent waiting rather than building.
              </p>
              <p>
                Meanwhile, the local tech industry has a genuine shortage of Cloud and
                DevOps engineers. These are among the best-paid entry points into the
                field, and unlike many careers, they do not require a degree to begin -
                they require demonstrable skill.
              </p>
              <p>
                The problem is access. International platforms price their courses in
                dollars and assume background knowledge that A/L students have not been
                given. Local institutes are expensive and largely confined to Colombo.
                Neither is built for a student in Matara or Vavuniya with a laptop and a
                year to spare.
              </p>
              <p className="text-onyx font-medium">
                {brand.name} is built for exactly that student: practical Cloud, DevOps
                and Software Engineering training that is affordable, online, and designed
                from the ground up for Sri Lankans starting from zero.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <FounderSection founder={founder} />
      <EducationAndExperienceSection
        education={founder.education}
        experience={founder.experience}
      />
      <CertificationsSection certifications={founder.certifications} />

      <Section className="bg-cream">
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
        <Container size="wide">
          <div className="bg-onyx relative overflow-hidden px-6 py-16 text-center sm:px-12 lg:py-20">
            <Liyawel
              strokeClassName="stroke-white"
              className="absolute -top-20 -left-20 size-96 opacity-[0.10]"
            />
            <Liyawel
              strokeClassName="stroke-white"
              className="absolute -right-24 -bottom-24 size-96 -scale-x-100 opacity-[0.08]"
            />

            <div className="relative mx-auto max-w-2xl">
              <span
                className="bg-mural-gold-400 mx-auto block h-0.5 w-14"
                aria-hidden="true"
              />
              <h2 className="font-display mt-6 text-4xl leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Want to talk to us?
              </h2>
              <p className="mt-5 text-base leading-relaxed text-white/70 sm:text-lg">
                Whether you are a student deciding where to start, or an employer looking
                for trained juniors, we would like to hear from you.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-terracotta-500 hover:bg-terracotta-400 rounded-none text-white"
                >
                  <Link href="/contact">Contact us</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="rounded-none border border-white/25 bg-white/10 text-white hover:bg-white/20"
                >
                  <Link href="/courses">Browse courses</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function FounderSection({ founder }: { founder: FounderProfile }) {
  const bioParagraphs = founder.bio.split("\n\n");

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

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-center lg:gap-14">
          <div className="border-hairline relative aspect-[4/5] w-full max-w-sm overflow-hidden border">
            <Image
              src={founder.photo_url}
              alt={founder.name}
              fill
              sizes="(min-width: 1024px) 24rem, 100vw"
              className="object-cover"
            />
          </div>

          <div>
            <h3 className="font-display text-onyx text-2xl font-semibold sm:text-3xl">
              {founder.name}
            </h3>
            <p className="text-terracotta-600 mt-1 text-sm font-medium">
              {founder.title}
            </p>
            <div className="measure text-mist mt-5 flex flex-col gap-4 text-base leading-relaxed">
              {bioParagraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

function EducationAndExperienceSection({
  education,
  experience,
}: {
  education: FounderProfile["education"];
  experience: FounderProfile["experience"];
}) {
  return (
    <Section className="border-hairline bg-surface border-y">
      <Container size="wide">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="text-terracotta-600 size-5" aria-hidden="true" />
              <h2 className="font-display text-onyx text-2xl font-semibold sm:text-3xl">
                Academic background
              </h2>
            </div>
            <div className="mt-10">
              <Timeline
                entries={education.map((entry) => ({
                  period: entry.period,
                  title: entry.institution,
                  subtitle: entry.detail,
                }))}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="text-terracotta-600 size-5" aria-hidden="true" />
              <h2 className="font-display text-onyx text-2xl font-semibold sm:text-3xl">
                Work history
              </h2>
            </div>
            <div className="mt-10">
              <Timeline
                entries={experience.map((entry) => ({
                  period: entry.period,
                  title: entry.role_title,
                  subtitle: entry.org,
                }))}
              />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

/** "2026-06-02" -> "Jun 2026". Falsy input (never issued) renders nothing. */
function formatCertMonth(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const date = new Date(`${isoDate}T00:00:00Z`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function CertificationsSection({
  certifications,
}: {
  certifications: FounderProfile["certifications"];
}) {
  return (
    <Section className="border-hairline bg-surface border-y">
      <Container size="wide">
        <div className="flex items-center gap-2">
          <BadgeCheck className="text-terracotta-600 size-5" aria-hidden="true" />
          <h2 className="font-display text-onyx text-2xl font-semibold sm:text-3xl">
            Certifications
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certifications.map((cert) => {
            const issued = formatCertMonth(cert.issued_date);
            const expires = formatCertMonth(cert.expiry_date);
            const Wrapper = cert.verify_url ? "a" : "div";

            return (
              <Wrapper
                key={cert.id}
                {...(cert.verify_url
                  ? { href: cert.verify_url, target: "_blank", rel: "noreferrer" }
                  : {})}
                className={`border-hairline bg-cream flex gap-4 border p-5 ${
                  cert.verify_url
                    ? "hover:border-terracotta-400/60 transition-colors"
                    : ""
                }`}
              >
                <div className="border-hairline bg-surface relative size-14 shrink-0 overflow-hidden border">
                  {cert.badge_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external badge artwork from Credly/CertDirectory/etc., not a next/image remotePatterns candidate
                    <img
                      src={cert.badge_image_url}
                      alt=""
                      className="h-full w-full object-contain p-1.5"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center">
                      <BadgeCheck
                        className="text-terracotta-400 size-6"
                        aria-hidden="true"
                      />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-onyx text-sm leading-snug font-semibold">
                    {cert.label}
                  </h3>
                  {cert.provider ? (
                    <p className="text-mist mt-1 text-xs">{cert.provider}</p>
                  ) : null}
                  {issued ? (
                    <p className="text-mist-soft mt-1 text-xs">
                      Issued {issued}
                      {expires ? ` · Expires ${expires}` : ""}
                    </p>
                  ) : null}
                </div>
              </Wrapper>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Vertical timeline: a dot-and-line rail built from a column flexbox rather
 * than absolute positioning, so the connecting line stretches correctly
 * between entries regardless of how tall each entry's text runs.
 */
function Timeline({
  entries,
}: {
  entries: { period: string; title: string; subtitle: string }[];
}) {
  return (
    <ol className="flex flex-col">
      {entries.map((entry, index) => (
        <li key={`${entry.title}-${entry.period}`} className="flex gap-5">
          <div className="flex flex-col items-center">
            <span className="bg-terracotta-600 mt-1.5 size-2.5 shrink-0 rounded-full" />
            {index < entries.length - 1 ? (
              <span className="bg-hairline mt-1.5 w-px flex-1" aria-hidden="true" />
            ) : null}
          </div>
          <div className="pb-10">
            <p className="text-terracotta-600 text-xs font-semibold tracking-wide uppercase">
              {entry.period}
            </p>
            <h3 className="font-display text-onyx mt-1 text-lg font-semibold">
              {entry.title}
            </h3>
            <p className="text-mist mt-1 text-sm leading-relaxed">{entry.subtitle}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
