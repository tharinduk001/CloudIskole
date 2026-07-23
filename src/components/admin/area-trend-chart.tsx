"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TrendPoint } from "@/lib/data/admin-analytics";
import { formatLkr } from "@/lib/format";

/**
 * Line-and-fill trend chart used for both the revenue and enrollment panels.
 *
 * Takes a `valueType` rather than a formatter function: this is a Client
 * Component fed from a Server Component page, and functions cannot cross
 * that boundary as props.
 */
export function AreaTrendChart({
  data,
  valueType,
  color,
}: {
  data: TrendPoint[];
  valueType: "currency" | "count";
  color: string;
}) {
  const formatValue = (value: number) => (valueType === "currency" ? formatLkr(value) : `${value}`);

  if (data.length === 0) {
    return (
      <div className="text-ink-subtle flex h-56 items-center justify-center text-sm">
        No data for this range yet.
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={`fill-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-line)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--color-ink-subtle)" }}
            tickFormatter={(value: string) =>
              new Date(value).toLocaleDateString("en-LK", { month: "short", day: "numeric" })
            }
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-ink-subtle)" }}
            tickFormatter={formatValue}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip
            formatter={(value) => formatValue(Number(value))}
            labelFormatter={(value) =>
              new Date(String(value)).toLocaleDateString("en-LK", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            }
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-line)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#fill-${color})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
