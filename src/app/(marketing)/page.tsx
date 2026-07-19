import {
  ArrowRight,
  Award,
  Cloud,
  Code2,
  GitBranch,
  Sparkles,
  Target,
  Terminal,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Liyawel } from "@/components/brand/liyawel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { faqs, features, steps, tracks } from "@/content/home";

const trackIcons: Record<(typeof tracks)[number]["icon"], LucideIcon> = {
  cloud: Cloud,
  pipeline: GitBranch,
  terminal: Terminal,
  code: Code2,
};

const featureIcons: Record<(typeof features)[number]["icon"], LucideIcon> = {
  wallet: Wallet,
  users: Users,
  target: Target,
  award: Award,
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Tracks />
      <Features />
      <HowItWorks />
      <Faq />
      <FinalCta />
    </>
  );
}

/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="bg-wash relative overflow-hidden">
      <Liyawel className="absolute -top-24 -left-32 size-[34rem] opacity-[0.05]" />
      <Liyawel className="absolute -right-40 -bottom-40 size-[38rem] -scale-x-100 opacity-[0.04]" />

      <Container size="wide" className="relative pt-16 pb-20 sm:pt-24 lg:pt-28 lg:pb-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Badge variant="gold" className="animate-in-up">
            <Sparkles aria-hidden="true" />
            Free courses open now — no card needed
          </Badge>

          <h1 className="animate-in-up font-display mt-6 text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4.25rem]">
            Start your <span className="text-teal-600">Cloud &amp; DevOps</span> career,
            right after A/Ls.
          </h1>

          <p className="animate-in-up text-ink-muted mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl">
            Practical, affordable training in the skills Sri Lankan tech companies are
            actually hiring for. Learn online, at your own pace, from your first command
            to your first pipeline.
          </p>

          <div className="animate-in-up mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Start learning free
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/courses">Browse courses</Link>
            </Button>
          </div>

          <p className="text-ink-subtle mt-5 text-sm">
            Free to join · Learn on any laptop · Certificates on completion
          </p>
        </div>

        <ul className="border-line mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-[var(--color-line)] sm:grid-cols-4">
          {[
            { value: "4", label: "Career tracks" },
            { value: "100%", label: "Online & self-paced" },
            { value: "Weekly", label: "Live sessions" },
            { value: "LKR", label: "Local pricing" },
          ].map((stat) => (
            <li key={stat.label} className="bg-surface px-4 py-6 text-center">
              <p className="font-display text-2xl font-semibold text-teal-600 sm:text-3xl">
                {stat.value}
              </p>
              <p className="text-ink-muted mt-1 text-xs sm:text-sm">{stat.label}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Tracks() {
  return (
    <Section id="tracks">
      <Container size="wide">
        <SectionHeading
          eyebrow="Career tracks"
          title="Four paths into the industry"
          description="Each track takes you from zero to job-ready with lessons, hands-on labs and quizzes. Start with a free one and move up."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {tracks.map((track) => {
            const Icon = trackIcons[track.icon];
            return (
              <Card key={track.title} interactive className="flex flex-col p-7">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-12 place-items-center rounded-xl bg-teal-50 text-teal-600">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <Badge variant={track.free ? "success" : "teal"}>
                    {track.free ? "Free" : "Paid"}
                  </Badge>
                </div>

                <h3 className="font-display mt-5 text-xl font-semibold">{track.title}</h3>
                <p className="text-ink-muted mt-2.5 text-sm leading-relaxed">
                  {track.description}
                </p>

                <ul className="mt-5 flex flex-wrap gap-2">
                  {track.topics.map((topic) => (
                    <li key={topic}>
                      <Badge variant="neutral" size="sm">
                        {topic}
                      </Badge>
                    </li>
                  ))}
                </ul>

                <div className="border-line text-ink-subtle mt-6 flex items-center gap-4 border-t pt-5 text-xs">
                  <span>{track.level}</span>
                  <span aria-hidden="true">·</span>
                  <span>{track.duration}</span>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Button asChild variant="secondary" size="lg">
            <Link href="/courses">
              See all courses
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

function Features() {
  return (
    <Section className="border-line bg-surface border-y">
      <Container size="wide">
        <SectionHeading
          eyebrow="Why CloudIskole"
          title="Built for Sri Lankan students, not adapted for them"
          description="Local pricing, local context, and the specific tools that appear in job postings here."
        />

        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = featureIcons[feature.icon];
            return (
              <div key={feature.title} className="flex flex-col">
                <span className="border-gold-200 bg-gold-50 text-gold-700 grid size-11 place-items-center rounded-xl border">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display mt-5 text-base font-semibold">
                  {feature.title}
                </h3>
                <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

function HowItWorks() {
  return (
    <Section>
      <Container size="wide">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps to your first certificate"
        />

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="relative">
              <Card className="h-full p-7">
                <span
                  className="font-display block text-5xl leading-none font-semibold text-teal-100"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                  {step.description}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

function Faq() {
  return (
    <Section className="border-line bg-surface border-y">
      <Container size="narrow">
        <SectionHeading eyebrow="Questions" title="Things students ask us" />
        <Accordion type="single" collapsible className="mt-12">
          {faqs.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="text-ink-muted mt-10 text-center text-sm">
          Still unsure?{" "}
          <Link href="/contact" className="font-medium text-teal-600 hover:underline">
            Ask us anything
          </Link>
          .
        </p>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

function FinalCta() {
  return (
    <Section>
      <Container size="wide">
        <div className="relative overflow-hidden rounded-3xl bg-teal-600 px-6 py-16 text-center sm:px-12 lg:py-20">
          <Liyawel
            strokeClassName="stroke-white"
            className="absolute -top-20 -left-20 size-96 opacity-[0.10]"
          />
          <Liyawel
            strokeClassName="stroke-white"
            className="absolute -right-24 -bottom-24 size-96 -scale-x-100 opacity-[0.08]"
          />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-3xl leading-tight text-white sm:text-4xl lg:text-[2.75rem]">
              Your A/L results do not decide your career. Your skills do.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-teal-50 sm:text-lg">
              Join free today and finish your first course before university even calls.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="accent" size="lg">
                <Link href="/sign-up">
                  Create free account
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="border border-white/25 bg-white/10 text-white hover:bg-white/20"
              >
                <Link href="/sessions">See upcoming sessions</Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
