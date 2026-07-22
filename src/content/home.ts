/**
 * Landing page copy and curated content.
 *
 * Kept out of the JSX so wording can be revised without touching layout.
 */

export const features = [
  {
    icon: "wallet" as const,
    title: "Start free, always",
    description:
      "Full courses at no cost, with paid tracks priced in rupees for Sri Lankan students - not converted from dollars.",
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
      "Earn badges as you learn - finish courses, build streaks, pass exams - and carry them with you as verifiable digital credentials.",
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

/**
 * Academic and community organisations CloudIskole's founder has trained,
 * judged for, or partnered with — the same relationships that feed the
 * course content and community events. Logos duplicated at render time by
 * the marquee component, not here.
 */
export const partners = [
  {
    name: "AWS Community Builders",
    logoUrl:
      "https://res.cloudinary.com/dopkcplb3/image/upload/v1783670441/Community_Builders_logo_for_dark_background_mq3vgk.png",
  },
  {
    name: "IDET - Institute of Digital Engineering Technology",
    logoUrl:
      "https://res.cloudinary.com/dopkcplb3/image/upload/v1783603855/download_bdsp4e.png",
  },
  {
    name: "FOSS Community Sri Lanka",
    logoUrl:
      "https://res.cloudinary.com/dopkcplb3/image/upload/v1783602831/FOSS_epzsbf.webp",
  },
  {
    name: "IEEE CS - University of Sri Jayewardenepura",
    logoUrl:
      "https://res.cloudinary.com/dopkcplb3/image/upload/v1783602879/ieee_cs_student_branch_chapter_university_of_sri_jayewardenepura_logo_evoxbp.jpg",
  },
  {
    name: "NIBM",
    logoUrl:
      "https://res.cloudinary.com/dopkcplb3/image/upload/v1783602971/1778030305129_eirpic.jpg",
  },
  {
    name: "University of Moratuwa Leo Club",
    logoUrl:
      "https://res.cloudinary.com/dopkcplb3/image/upload/v1783603972/leo_ztyhcn.png",
  },
  {
    name: "IEEE SB - University of Vavuniya",
    logoUrl:
      "https://res.cloudinary.com/dopkcplb3/image/upload/v1783709980/ieeesbuov_logo_cxuvx8.jpg",
  },
];

/**
 * Five photos, one designated as the large anchor tile — the grid layout
 * (see `PhotoGrid`) is built to exactly fill both its mobile (2x4) and
 * desktop (4x2) cell counts with this count, no rotation logic needed.
 */
export const momentPhotos = [
  {
    src: "https://res.cloudinary.com/dopkcplb3/image/upload/v1783742890/654222454_926408150252488_6231460814954891148_n_jsrc5t.jpg",
    alt: "Speaking at a University of Moratuwa tech event",
  },
  {
    src: "https://res.cloudinary.com/dopkcplb3/image/upload/v1783675783/highlights_1_kgsj5v.jpg",
    alt: "Judging the Beauty of Cloud hackathon",
  },
  {
    src: "https://res.cloudinary.com/dopkcplb3/image/upload/v1783675780/highlights_11_hao4gw.jpg",
    alt: "Leading CryptX, an island-wide hackathon and CTF",
  },
  {
    src: "https://res.cloudinary.com/dopkcplb3/image/upload/v1783742890/569976493_811777995048838_9210082039700355004_n_efyp1x.jpg",
    alt: "At Kubernetes Community Day Sri Lanka",
  },
  {
    src: "https://res.cloudinary.com/dopkcplb3/image/upload/v1783680392/741906689_2810501982647474_856743842466341450_n_mxbrmj.jpg",
    alt: "Running a cloud training session at NIBM",
  },
  {
    src: "https://res.cloudinary.com/dopkcplb3/image/upload/v1783675784/highlights_2_ibzlxn.jpg",
    alt: "On the judging panel at Beauty of Cloud",
  },
  {
    src: "https://res.cloudinary.com/dopkcplb3/image/upload/v1783742890/732610192_1598260788381984_288652173330552542_n_lyv6sx.jpg",
    alt: "Kubernetes community meetup in Colombo",
  },
  {
    src: "https://res.cloudinary.com/dopkcplb3/image/upload/v1783675781/highlights_15_hhd93y.jpg",
    alt: "FOSS Community Sri Lanka session",
  },
];

export const faqs = [
  {
    question: "Do I need any programming experience to start?",
    answer:
      "No. The Cloud Foundations and Linux & Networking tracks assume you have never opened a terminal before. If you passed A/Ls in any stream - Maths, Bio, Commerce or Arts - you can follow along.",
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
      "English. Every cloud and DevOps tool, exam and job interview you will meet is in English, so we teach in it deliberately - but at a pace built for Sri Lankan students, not native speakers.",
  },
  {
    question: "Will this actually help me get a job?",
    answer:
      "Cloud and DevOps are among the highest-paying entry points in the Sri Lankan tech industry, and the shortage is real. We focus on the specific tools listed in local job postings, and you finish with projects and badges you can show.",
  },
];
