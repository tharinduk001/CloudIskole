import {
  ArrowRight,
  Award,
  Sparkles,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Liyawel } from "@/components/brand/liyawel";
import { PartnersMarquee } from "@/components/site/partners-marquee";
import { PhotoGrid } from "@/components/site/photo-grid";
import { ToolMarquee } from "@/components/site/tool-marquee";
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
import { faqs, features, steps } from "@/content/home";

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
      <ToolMarquee />
      <PartnersMarquee />
      <Features />
      <HowItWorks />
      <Moments />
      <Faq />
      <FinalCta />
    </>
  );
}

/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="bg-mural-wash relative overflow-hidden">
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/backgrounds/mural-hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={60}
          className="object-cover object-bottom opacity-[0.42]"
        />
        <div className="from-mural-wash via-mural-wash/70 to-mural-wash/90 absolute inset-0 bg-gradient-to-b" />
      </div>

      <Container
        size="wide"
        className="relative z-10 pt-16 pb-20 sm:pt-24 lg:pt-28 lg:pb-28"
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <Badge className="animate-in-up bg-terracotta-50 text-terracotta-600 rounded-none border-0">
            <Sparkles aria-hidden="true" />
            Free courses open now - no card needed
          </Badge>

          <h1 className="animate-in-up font-display text-onyx mt-6 text-5xl leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl">
            Start your <span className="text-terracotta-500">Cloud &amp; DevOps</span>{" "}
            career, right after A/Ls.
          </h1>

          <p className="animate-in-up text-mist mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl">
            Practical, affordable training in the skills Sri Lankan tech companies are
            actually hiring for. Learn online, at your own pace, from your first command
            to your first pipeline.
          </p>

          <div className="animate-in-up mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-terracotta-600 hover:bg-terracotta-700 active:bg-terracotta-700 rounded-none"
            >
              <Link href="/sign-up">
                Start learning free
                <ArrowRight aria-hidden="true" />
              </Link>
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

          <p className="text-mist-soft mt-5 text-sm">
            Free to join · Learn on any laptop · Badges on completion
          </p>
        </div>

        <ul className="border-hairline mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-px overflow-hidden border bg-[var(--color-hairline)] sm:grid-cols-4">
          {[
            { value: "4", label: "Career tracks" },
            { value: "100%", label: "Online & self-paced" },
            { value: "Weekly", label: "Live sessions" },
            { value: "LKR", label: "Local pricing" },
          ].map((stat) => (
            <li key={stat.label} className="bg-mural-wash px-4 py-6 text-center">
              <p className="font-display text-terracotta-600 text-2xl font-semibold sm:text-3xl">
                {stat.value}
              </p>
              <p className="text-mist mt-1 text-xs sm:text-sm">{stat.label}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Features() {
  return (
    <Section className="border-hairline bg-surface border-y">
      <Container size="wide">
        <SectionHeading
          size="xl"
          eyebrow="Why CloudIskole"
          title="Built for Sri Lankan students, not adapted for them"
          description="Local pricing, local context, and the specific tools that appear in job postings here."
          eyebrowClassName="text-terracotta-600"
          titleClassName="text-onyx"
        />

        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = featureIcons[feature.icon];
            return (
              <div key={feature.title} className="flex flex-col">
                <span className="border-terracotta-400/40 bg-terracotta-50 text-terracotta-600 grid size-11 place-items-center rounded-none border">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display text-onyx mt-5 text-base font-semibold">
                  {feature.title}
                </h3>
                <p className="text-mist mt-2 text-sm leading-relaxed">
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

function Moments() {
  return (
    <Section className="bg-cream">
      <Container size="wide">
        <SectionHeading
          size="xl"
          eyebrow="Community"
          title="Moments from the journey"
          description="Meetups, hackathons and training sessions from the community CloudIskole grew out of."
          eyebrowClassName="text-terracotta-600"
          titleClassName="text-onyx"
        />
        <div className="mt-14">
          <PhotoGrid />
        </div>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

function HowItWorks() {
  return (
    <Section className="bg-cream">
      <Container size="wide">
        <SectionHeading
          size="xl"
          eyebrow="How it works"
          title="Three steps to your first badge"
          eyebrowClassName="text-terracotta-600"
          titleClassName="text-onyx"
        />

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="relative">
              <Card className="border-hairline h-full rounded-none p-7">
                <span
                  className="font-display text-terracotta-50 block text-5xl leading-none font-semibold [-webkit-text-stroke:1px_var(--color-terracotta-400)]"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-onyx mt-4 text-lg font-semibold">
                  {step.title}
                </h3>
                <p className="text-mist mt-2 text-sm leading-relaxed">
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
    <Section id="faq" className="border-hairline bg-surface border-y">
      <Container size="narrow">
        <SectionHeading
          size="xl"
          eyebrow="Questions"
          title="Things students ask us"
          eyebrowClassName="text-terracotta-600"
          titleClassName="text-onyx"
        />
        <Accordion type="single" collapsible className="mt-12">
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.question}
              value={faq.question}
              className="border-hairline"
            >
              <AccordionTrigger className="text-onyx hover:text-terracotta-600">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-mist">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="text-mist mt-10 text-center text-sm">
          Still unsure?{" "}
          <Link
            href="/contact"
            className="text-terracotta-600 font-medium hover:underline"
          >
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
              Your A/L results do not decide your career. Your skills do.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/70 sm:text-lg">
              Join free today and finish your first course before university even calls.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-terracotta-500 hover:bg-terracotta-400 rounded-none text-white"
              >
                <Link href="/sign-up">
                  Create free account
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="rounded-none border border-white/25 bg-white/10 text-white hover:bg-white/20"
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
