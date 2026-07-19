import { BookOpen, ReceiptText, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getAdminOverview } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const stats = await getAdminOverview();

  const cards = [
    {
      label: "Orders awaiting review",
      value: stats.pendingReview,
      href: "/admin/orders",
      icon: ReceiptText,
      highlight: stats.pendingReview > 0,
    },
    { label: "Students", value: stats.totalStudents, href: "/admin/courses", icon: Users },
    { label: "Courses", value: stats.totalCourses, href: "/admin/courses", icon: BookOpen },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Admin overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card
              interactive
              className={`p-5 ${c.highlight ? "border-gold-300 bg-gold-50/40" : ""}`}
            >
              <c.icon className="text-ink-subtle size-5" aria-hidden="true" />
              <p className="text-ink mt-3 text-3xl font-semibold">{c.value}</p>
              <p className="text-ink-muted mt-1 text-sm">{c.label}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
