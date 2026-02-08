/**
 * Time Helpers
 * Date/time parsing and timezone utilities
 */

// Parse round start time from date and time strings
export function parseRoundStartTime(date: string, startTime: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = startTime.split(':').map(Number);
  const CET_OFFSET_HOURS = 1;
  return new Date(Date.UTC(year, month - 1, day, hours - CET_OFFSET_HOURS, minutes, 0, 0));
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
