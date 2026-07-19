import type { Metadata } from "next";

import { BadgeForm } from "@/components/admin/badge-form";
import { Card } from "@/components/ui/card";
import { listBadgesAdmin } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Badges" };

export default async function AdminBadgesPage() {
  const badges = await listBadgesAdmin();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold">Badges</h1>
      <p className="text-ink-muted mt-1 text-sm">
        Auto-awarded badges (Course Graduate, 7/30-day streaks) are seeded already — the app
        looks them up by slug, so keep those three as-is unless you also update the migration.
        Add more here for other achievements.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {badges.map((badge) => (
          <Card key={badge.id} className="p-5">
            <BadgeForm badge={badge} />
          </Card>
        ))}
        <Card className="border-dashed p-5">
          <BadgeForm />
        </Card>
      </div>
    </div>
  );
}
