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

/**
 * Converts a datetime-local input value to an ISO string with local timezone offset.
 * This ensures the datetime is stored correctly in timestamptz columns.
 * 
 * Example: "2026-02-11T16:08" becomes "2026-02-11T16:08:00-03:00" (for BRT timezone)
 */
export function toLocalISOString(dateTimeLocalValue: string): string {
  if (!dateTimeLocalValue) return "";
  
  // Create a date object from the datetime-local value
  // By appending the local timezone offset, we ensure the correct UTC time is stored
  const date = new Date(dateTimeLocalValue);
  
  // Get timezone offset in minutes and convert to hours:minutes format
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
  const minutes = String(Math.abs(offset) % 60).padStart(2, "0");
  
  // Return ISO string with timezone offset
  return `${dateTimeLocalValue}:00${sign}${hours}:${minutes}`;
}
