import { Database, ReceiptText, ScrollText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const exports = [
  {
    href: "/admin/audit/export/database",
    icon: Database,
    title: "Full database backup",
    description:
      "Every table in the public schema as one JSON file — the closest thing to a manual pg_dump without shell access to the production database. Auth credentials live in Supabase's own auth schema and aren't included.",
    cta: "Download backup (.json)",
  },
  {
    href: "/admin/audit/export/audit-log",
    icon: ScrollText,
    title: "Audit log",
    description:
      "Every administrative action ever recorded — role changes, publishing, enrollment grants. Not just the last 100 shown above.",
    cta: "Download audit log (.csv)",
  },
  {
    href: "/admin/audit/export/payment-log",
    icon: ReceiptText,
    title: "Payment events",
    description:
      "The full append-only financial log — every order transition, success or failure.",
    cta: "Download payment log (.csv)",
  },
];

/**
 * Manual, on-demand exports an admin can pull down to their own machine.
 * There's no automated off-site backup job yet, so this is the stopgap: a
 * human clicking a button periodically beats no backup at all.
 */
export function BackupsPanel() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {exports.map((item) => (
        <Card key={item.href} className="flex flex-col gap-3 p-5">
          <item.icon className="text-ink-subtle size-5" aria-hidden="true" />
          <div>
            <h3 className="font-display text-base font-semibold">{item.title}</h3>
            <p className="text-ink-muted mt-1 text-sm">{item.description}</p>
          </div>
          <Button asChild size="sm" className="mt-auto w-fit">
            <a href={item.href} download>
              {item.cta}
            </a>
          </Button>
        </Card>
      ))}
    </div>
  );
}
