/**
 * Landing page copy and curated content.
 *
 * Kept out of the JSX so wording can be revised without touching layout.
 * The tracks below are the intended course catalogue; once courses exist in
 * the database (Phase 2) the tracks section reads from there instead.
 */

export const tracks = [
  {
    icon: "cloud" as const,
    title: "Cloud Foundations",
    description:
      "How the cloud actually works — compute, storage, networking and identity — using AWS free tier so you pay nothing to practise.",
    topics: ["AWS EC2 & S3", "VPC & networking", "IAM & security", "Billing & free tier"],
    level: "Beginner",
    duration: "6 weeks",
    free: true,
  },
  {
    icon: "pipeline" as const,
    title: "DevOps Engineering",
    description:
      "The track employers hire for. Build real pipelines that take code from your laptop to production automatically.",
    topics: ["Git & GitHub", "Docker", "CI/CD pipelines", "Kubernetes basics"],
    level: "Intermediate",
    duration: "10 weeks",
    free: false,
  },
  {
    icon: "terminal" as const,
    title: "Linux & Networking",
    description:
      "The ground floor of every IT career. Command line fluency, servers, SSH and the networking every interview asks about.",
    topics: ["Bash & shell", "Users & permissions", "SSH & servers", "DNS, HTTP, TCP/IP"],
    level: "Beginner",
    duration: "5 weeks",
    free: true,
  },
  {
    icon: "code" as const,
    title: "Software Engineering",
    description:
      "Programming fundamentals, version control and the working habits that separate a hobbyist from a hireable engineer.",
    topics: ["Python basics", "Git workflows", "APIs & databases", "Clean code"],
    level: "Beginner",
    duration: "8 weeks",
    free: false,
  },
];

export const features = [
  {
    icon: "wallet" as const,
    title: "Start free, always",
    description:
      "Full courses at no cost, with paid tracks priced in rupees for Sri Lankan students — not converted from dollars.",
  },
  {
    icon: "users" as const,
    title: "Live weekly sessions",
    description:
      "Join live online classes, ask questions in real time, and catch the recording later if you miss one.",
  },
  {
    icon: "target" as const,
    title: "Practice that sticks",
    description:
      "Quizzes after every lesson and dedicated exams with instant marking, explanations and a leaderboard.",
  },
  {
    icon: "award" as const,
    title: "Badges that mean something",
    description:
      "Earn badges as you learn — finish courses, build streaks, pass exams — and carry them with you as verifiable digital credentials.",
  },
];

export const steps = [
  {
    title: "Create your free account",
    description:
      "Sign up with Google or your email in under a minute. No card, no commitment.",
  },
  {
    title: "Pick a track and learn",
    description:
      "Work through video and written lessons at your own pace, then test yourself with quizzes.",
  },
  {
    title: "Earn your badges",
    description:
      "Pass the final exam, collect your badges, and put them on your CV and LinkedIn.",
  },
];

export const faqs = [
  {
    question: "Do I need any programming experience to start?",
    answer:
      "No. The Cloud Foundations and Linux & Networking tracks assume you have never opened a terminal before. If you passed A/Ls in any stream — Maths, Bio, Commerce or Arts — you can follow along.",
  },
  {
    question: "Is it really free?",
    answer:
      "Several complete courses are free with no time limit and no card required. Advanced tracks are paid, priced in Sri Lankan rupees to stay affordable for students.",
  },
  {
    question: "How do I pay for a paid course?",
    answer:
      "Right now, by bank transfer. You will get a unique reference number and our bank details, you upload your deposit slip, and we activate your enrollment as soon as we confirm the payment. Card payments are coming soon.",
  },
  {
    question: "Do I need a powerful computer?",
    answer:
      "Any laptop that runs a browser is enough. The labs use free cloud accounts and browser-based tools, so nothing heavy runs on your machine.",
  },
  {
    question: "Are the courses in Sinhala or English?",
    answer:
      "English. Every cloud and DevOps tool, exam and job interview you will meet is in English, so we teach in it deliberately — but at a pace built for Sri Lankan students, not native speakers.",
  },
  {
    question: "Will this actually help me get a job?",
    answer:
      "Cloud and DevOps are among the highest-paying entry points in the Sri Lankan tech industry, and the shortage is real. We focus on the specific tools listed in local job postings, and you finish with projects and badges you can show.",
  },
];
