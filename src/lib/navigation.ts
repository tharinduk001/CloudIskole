/**
 * Site navigation, defined once and consumed by the header, the mobile menu,
 * the footer and the sitemap — so a new page cannot appear in one and go
 * missing from the others.
 */

export interface NavItem {
  label: string;
  href: string;
  description?: string;
}

/** Primary header navigation. */
export const mainNav: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Courses", href: "/courses" },
  { label: "Sessions", href: "/sessions" },
  { label: "Exams", href: "/exams" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Contact", href: "/contact" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Learn",
    items: [
      { label: "All courses", href: "/courses" },
      { label: "Live sessions", href: "/sessions" },
      { label: "Practice exams", href: "/exams" },
      { label: "Leaderboard", href: "/leaderboard" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About us", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms & conditions", href: "/terms" },
      { label: "Refunds & returns", href: "/refunds" },
    ],
  },
];
