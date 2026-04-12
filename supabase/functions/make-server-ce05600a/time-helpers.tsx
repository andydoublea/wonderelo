/**
 * Time Helpers
 * Date/time parsing and timezone utilities
 */

/**
 * Get the UTC offset for Central European Time, accounting for DST.
 * CET = UTC+1 (winter), CEST = UTC+2 (summer/DST)
 * DST runs from last Sunday of March at 01:00 UTC to last Sunday of October at 01:00 UTC.
 */
export function getCETOffsetHours(date: Date): number {
  const year = date.getUTCFullYear();
  // Last Sunday of March: start from March 31, walk back to Sunday
  const march31 = new Date(Date.UTC(year, 2, 31));
  const dstStart = new Date(Date.UTC(year, 2, 31 - march31.getUTCDay(), 1, 0, 0));
  // Last Sunday of October: start from October 31, walk back to Sunday
  const oct31 = new Date(Date.UTC(year, 9, 31));
  const dstEnd = new Date(Date.UTC(year, 9, 31 - oct31.getUTCDay(), 1, 0, 0));
  return (date >= dstStart && date < dstEnd) ? 2 : 1;
}

// Parse round start time from date and time strings (DST-aware)
export function parseRoundStartTime(date: string, startTime: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = startTime.split(':').map(Number);
  // Build a rough UTC date to determine DST status, then apply correct offset
  const roughUtc = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
  const offset = getCETOffsetHours(roughUtc);
  return new Date(Date.UTC(year, month - 1, day, hours - offset, minutes, 0, 0));
}

// Get current time (can be overridden for testing)
export function getCurrentTime(c: any): Date {
  // Check if there's a test time override
  const testTime = c.req.header('X-Test-Time');
  if (testTime) {
    return new Date(testTime);
  }
  return new Date();
}

// Format date to YYYY-MM-DD
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format time to HH:MM
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Add minutes to a date
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

// Check if date is in the past
export function isInPast(date: Date, now: Date = new Date()): boolean {
  return date < now;
}

// Check if date is in the future
export function isInFuture(date: Date, now: Date = new Date()): boolean {
  return date > now;
}
