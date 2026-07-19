import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names, resolving conflicting Tailwind utilities so the last
 * one wins (e.g. `cn("px-2", "px-4")` yields `"px-4"`). Lets components
 * accept a `className` override without fighting their own base styles.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
