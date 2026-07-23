"use client";

import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Images,
  LayoutDashboard,
  ListChecks,
  Menu,
  ReceiptText,
  ScrollText,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/sessions", label: "Sessions", icon: CalendarDays },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/quizzes", label: "Quizzes", icon: ListChecks },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/audit", label: "Audit & payments", icon: ScrollText },
  { href: "/admin/site-content", label: "Site content", icon: Images },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-1">
      {navItems.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-teal-50 text-teal-700"
                : "text-ink-muted hover:bg-teal-50/60 hover:text-teal-700",
            )}
          >
            <item.icon className="size-4.5 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Vertical admin nav: a fixed left sidebar on lg+ screens, collapsing to a
 * top bar + slide-down panel below that (mirrors the site header's mobile
 * pattern) since a permanent sidebar has no room on narrow viewports.
 */
export function AdminNav() {
  const pathname = usePathname();
  // Stores the path it was opened on rather than a boolean, so navigating
  // (which changes `pathname`) closes the panel with no effect + setState.
  const [openedOnPath, setOpenedOnPath] = React.useState<string | null>(null);
  const open = openedOnPath === pathname;

  return (
    <>
      <aside className="border-line bg-surface fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r px-4 py-6 lg:flex">
        <Link href="/admin" aria-label="Admin home" className="rounded-lg px-1">
          <Logo />
        </Link>
        <div className="mt-8 flex flex-1 flex-col">
          <NavLinks pathname={pathname} />
        </div>
        <Link
          href="/dashboard"
          className="text-ink-subtle hover:text-ink-muted mt-4 flex items-center gap-2 px-3 py-2 text-xs font-medium"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to student dashboard
        </Link>
      </aside>

      <header className="border-line bg-surface sticky top-0 z-40 flex h-16 items-center justify-between border-b px-4 sm:px-6 lg:hidden">
        <Link href="/admin" aria-label="Admin home" className="rounded-lg">
          <Logo />
        </Link>
        <button
          type="button"
          onClick={() => setOpenedOnPath(open ? null : pathname)}
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="text-ink -mr-2 grid size-11 place-items-center rounded-lg hover:bg-teal-50"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {open ? (
        <div
          id="admin-mobile-nav"
          className="border-line bg-surface fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t px-4 py-4 lg:hidden"
        >
          <NavLinks pathname={pathname} onNavigate={() => setOpenedOnPath(null)} />
          <Link
            href="/dashboard"
            className="text-ink-subtle mt-4 flex items-center gap-2 px-3 py-2 text-xs font-medium"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back to student dashboard
          </Link>
        </div>
      ) : null}
    </>
  );
}
