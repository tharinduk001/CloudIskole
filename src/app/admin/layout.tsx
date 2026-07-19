import {
  Award,
  BookOpen,
  CalendarDays,
  FileBadge2,
  LayoutDashboard,
  ListChecks,
  ReceiptText,
  ScrollText,
} from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/layout";
import { requireAdmin } from "@/lib/data/auth";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/quizzes", label: "Quizzes", icon: ListChecks },
  { href: "/admin/sessions", label: "Sessions", icon: CalendarDays },
  { href: "/admin/badges", label: "Badges", icon: Award },
  { href: "/admin/certificates", label: "Certificates", icon: FileBadge2 },
  { href: "/admin/audit", label: "Audit & payments", icon: ScrollText },
];

/**
 * Shell for `/admin/*`. `requireAdmin()` re-reads the role from the database
 * on every request — never from a cookie or a client-supplied value — and
 * redirects a non-admin to `/dashboard` without revealing this route exists.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();

  return (
    <div className="bg-wash min-h-screen">
      <header className="border-line bg-surface border-b">
        <Container size="wide">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Link href="/admin" aria-label="Admin home" className="rounded-lg">
                <Logo />
              </Link>
              <nav aria-label="Admin" className="hidden gap-1 sm:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-ink-muted inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium hover:bg-teal-50 hover:text-teal-700"
                  >
                    <item.icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <Link
              href="/dashboard"
              className="text-ink-subtle text-xs font-medium hover:underline"
            >
              Back to student dashboard
            </Link>
          </div>
        </Container>
      </header>

      <main id="main" className="py-8">
        <Container size="wide">{children}</Container>
      </main>
    </div>
  );
}
