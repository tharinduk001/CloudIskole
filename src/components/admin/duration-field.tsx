"use client";

import * as React from "react";

import { Input, Label } from "@/components/ui/field";

/** Minutes:seconds pair that submits as a single total-seconds hidden field. */
export function DurationField({
  name,
  defaultSeconds,
}: {
  name: string;
  defaultSeconds?: number | null;
}) {
  const [minutes, setMinutes] = React.useState(
    defaultSeconds ? Math.floor(defaultSeconds / 60) : 0,
  );
  const [seconds, setSeconds] = React.useState(defaultSeconds ? defaultSeconds % 60 : 0);

  return (
    <div className="flex flex-col gap-2">
      <Label>Duration</Label>
      <input type="hidden" name={name} value={minutes * 60 + seconds} />
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          aria-label="Minutes"
          value={minutes}
          onChange={(e) => setMinutes(Math.max(0, Number(e.target.value) || 0))}
          className="w-20"
        />
        <span className="text-ink-subtle text-sm">min</span>
        <Input
          type="number"
          min={0}
          max={59}
          aria-label="Seconds"
          value={seconds}
          onChange={(e) =>
            setSeconds(Math.min(59, Math.max(0, Number(e.target.value) || 0)))
          }
          className="w-20"
        />
        <span className="text-ink-subtle text-sm">sec</span>
      </div>
    </div>
  );
}
