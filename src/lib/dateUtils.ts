import { parseISO } from "date-fns";

/**
 * Parses a datetime string preserving local time.
 * 
 * When storing dates from datetime-local inputs, the value is stored without timezone
 * (e.g., "2025-02-03T14:00"). When using `new Date()` on these strings, JavaScript
 * may interpret them as UTC, causing timezone shifts.
 * 
 * This function ensures the date is parsed correctly as local time.
 */
export function parseLocalDateTime(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  // For datetime strings from datetime-local input stored without timezone
  // we need to treat them as local time, not UTC
  if (dateStr.includes("T") && !dateStr.includes("Z") && !dateStr.includes("+")) {
    // Already local format like "2025-02-03T14:00"
    return parseISO(dateStr);
  }
  
  // For ISO strings with Z or offset, parse normally
  return new Date(dateStr);
}

/**
 * Formats a local date string for display, avoiding timezone conversion issues.
 */
export function formatLocalDate(dateStr: string, formatFn: (date: Date) => string): string {
  return formatFn(parseLocalDateTime(dateStr));
}
