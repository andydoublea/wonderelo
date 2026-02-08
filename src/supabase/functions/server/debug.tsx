/**
 * Debug logging utilities for backend
 * 
 * Set DEBUG_MODE=true in environment to enable verbose logging
 * In production, set DEBUG_MODE=false or leave unset to disable debug logs
 */

// Keep debug mode ON for development/troubleshooting
const DEBUG_MODE = true;

// In-memory log storage (last 500 logs)
const MAX_LOGS = 500;
const logBuffer: Array<{
  timestamp: string;
  level: 'debug' | 'error' | 'info';
  message: string;
  args: any[];
}> = [];

/**
 * Add log to buffer
 */
function addToBuffer(level: 'debug' | 'error' | 'info', message: string, args: any[]) {
  logBuffer.push({
    timestamp: new Date().toISOString(),
    level,
    message,
    args
  });
  
  // Keep only last MAX_LOGS entries
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.shift();
  }
}

/**
 * Get recent logs from buffer
 */
export function getRecentLogs(limit = 100): typeof logBuffer {
  return logBuffer.slice(-limit);
}

/**
 * Clear log buffer
 */
export function clearLogs(): void {
  logBuffer.length = 0;
}

/**
 * Log debug information (only in debug mode)
 */
export function debugLog(...args: any[]): void {
  if (DEBUG_MODE) {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    console.log('[DEBUG]', ...args);
    addToBuffer('debug', message, args);
  }
}

/**
 * Log errors (always logged regardless of debug mode)
 */
export function errorLog(...args: any[]): void {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  
  console.error('[ERROR]', ...args);
  addToBuffer('error', message, args);
}

/**
 * Log info (always logged regardless of debug mode)
 */
export function infoLog(...args: any[]): void {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  
  console.log('[INFO]', ...args);
  addToBuffer('info', message, args);
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(): boolean {
  return DEBUG_MODE;
}