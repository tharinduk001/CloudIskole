import type { StatusBreakdownEntry } from "@/lib/data/admin-analytics";

/** Matches the Badge colors `src/app/admin/orders/page.tsx` uses for the same statuses. */
const STATUS_COLOR: Record<string, string> = {
  paid: "var(--color-success)",
  under_review: "var(--color-warning)",
  pending: "var(--color-ink-subtle)",
  rejected: "var(--color-danger)",
  failed: "var(--color-danger)",
  cancelled: "var(--color-ink-subtle)",
  refunded: "var(--color-ink-subtle)",
};

export function StatusBreakdownBars({ entries }: { entries: StatusBreakdownEntry[] }) {
  const total = entries.reduce((sum, e) => sum + e.count, 0);

  if (total === 0) {
    return <p className="text-ink-subtle text-sm">No orders in this range yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => {
        const pct = Math.round((entry.count / total) * 100);
        return (
          <div key={entry.status}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink capitalize">{entry.status.replace("_", " ")}</span>
              <span className="text-ink-muted">
                {entry.count} · {pct}%
              </span>
            </div>
            <div className="bg-paper mt-1 h-2 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{
                  width: `${pct}%`,
                  backgroundColor: STATUS_COLOR[entry.status] ?? "var(--color-ink-subtle)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
