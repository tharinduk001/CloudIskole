import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { listStudents } from "@/lib/data/admin";
import { formatLkr } from "@/lib/format";

export const metadata: Metadata = { title: "Students" };

const PAGE_SIZE = 20;

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search?.trim() || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { students, total } = await listStudents({ search, page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number) {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (p > 1) qs.set("page", String(p));
    const query = qs.toString();
    return query ? `/admin/students?${query}` : "/admin/students";
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Students</h1>
      <p className="text-ink-muted mt-1 text-sm">{total} students total.</p>

      <form method="get" className="mt-6 flex gap-2">
        <input
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Search by name or email"
          className="border-line-strong bg-surface text-ink placeholder:text-ink-subtle h-11 flex-1 rounded-xl border px-4 text-sm focus:border-teal-500 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-teal-600 hover:bg-teal-700 h-11 rounded-xl px-5 text-sm font-medium text-white"
        >
          Search
        </button>
      </form>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper text-ink-muted text-left text-xs font-semibold tracking-wide uppercase">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Enrollments</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Total spent</th>
              <th className="px-4 py-3">CloudCoins</th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-teal-50/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/students/${s.id}`}
                    className="font-medium text-teal-700 hover:underline"
                  >
                    {s.full_name || "Unnamed student"}
                  </Link>
                  <div className="text-ink-subtle text-xs">{s.email}</div>
                </td>
                <td className="text-ink-subtle px-4 py-3 text-xs">
                  {s.created_at ? new Date(s.created_at).toLocaleDateString("en-LK") : "-"}
                </td>
                <td className="text-ink px-4 py-3">{s.enrollment_count}</td>
                <td className="text-ink px-4 py-3">{s.completed_count}</td>
                <td className="text-ink px-4 py-3">{formatLkr(s.total_spent_cents ?? 0)}</td>
                <td className="text-ink px-4 py-3">{s.total_xp}</td>
              </tr>
            ))}
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-ink-muted px-4 py-8 text-center">
                  No students found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-ink-muted">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="border-line-strong text-ink-muted hover:bg-teal-50/60 rounded-lg border px-3 py-1.5"
              >
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={pageHref(page + 1)}
                className="border-line-strong text-ink-muted hover:bg-teal-50/60 rounded-lg border px-3 py-1.5"
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
