/** Formats integer cents as an LKR price string, e.g. 2500000 -> "Rs 25,000". */
export function formatLkr(amountCents: number): string {
  const rupees = amountCents / 100;
  return `Rs ${rupees.toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
}

/** Formats seconds as "1h 20m" / "45m" / "< 1m", for lesson and course durations. */
export function formatDuration(totalSeconds: number | null): string | null {
  if (!totalSeconds || totalSeconds <= 0) return null;
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 1) return "< 1m";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

const levelLabels: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function formatLevel(level: string): string {
  return levelLabels[level] ?? level;
}
