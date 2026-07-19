import type { Metadata } from "next";

import { SessionForm } from "@/components/admin/session-form";
import { Card } from "@/components/ui/card";
import { listCoursesAdmin } from "@/lib/data/admin";

export const metadata: Metadata = { title: "New session" };

export default async function NewSessionPage() {
  const courses = await listCoursesAdmin();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold">New session</h1>
      <Card className="mt-6 p-6">
        <SessionForm courses={courses.map((c) => ({ id: c.id, title: c.title }))} />
      </Card>
    </div>
  );
}
