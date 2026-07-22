import "server-only";

/** Wraps a value in quotes and escapes embedded quotes if it needs CSV escaping. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : JSON.stringify(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/** Serialises rows with a shared column set to CSV, header row first. */
export function toCsv(rows: Record<string, unknown>[]): string {
  const [first] = rows;
  if (!first) return "";
  const columns = Object.keys(first);
  const lines = rows.map((row) => columns.map((col) => csvCell(row[col])).join(","));
  return [columns.join(","), ...lines].join("\n");
}

/** `YYYY-MM-DD`, for filenames. */
export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function attachmentHeaders(filename: string, contentType: string): HeadersInit {
  return {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
  };
}
