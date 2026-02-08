/**
 * Debug logging utilities for frontend
 * 
 * Debug logs are controlled by localStorage flag 'debug_mode'
 * To enable: localStorage.setItem('debug_mode', 'true')
 * To disable: localStorage.setItem('debug_mode', 'false')
 * 
 * DEFAULT: Debug mode is ENABLED by default
 */

/**
 * Check if debug mode is enabled
 */
function isDebugMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  const debugModeValue = localStorage.getItem('debug_mode');
  
  // DEFAULT: true (enabled by default)
  // Only disabled if explicitly set to 'false'
  if (debugModeValue === null) {
    return true; // Default to enabled
  }
  
  return debugModeValue === 'true';
}

/**
 * Log debug information (only in debug mode)
 */
export function debugLog(...args: any[]): void {
  if (isDebugMode()) {
    console.log('[DEBUG]', ...args);
  }
}

/**
 * Log errors (always logged regardless of debug mode)
 */
export function errorLog(...args: any[]): void {
  console.error('[ERROR]', ...args);
}

/**
 * Log info (always logged regardless of debug mode)
 */
export function infoLog(...args: any[]): void {
  console.log('[INFO]', ...args);
}

/**
 * Enable debug mode
 */
export function enableDebugMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('debug_mode', 'true');
    console.log('✅ Debug mode ENABLED');
  }
}

/**
 * Disable debug mode
 */
export function disableDebugMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('debug_mode', 'false');
    console.log('✅ Debug mode DISABLED');
  }
}

/**
 * Toggle debug mode
 */
export function toggleDebugMode(): void {
  if (isDebugMode()) {
    disableDebugMode();
  } else {
    enableDebugMode();
  }
}

// Expose debug controls to window for easy access in console
if (typeof window !== 'undefined') {
  (window as any).debug = {
    enable: enableDebugMode,
    disable: disableDebugMode,
    toggle: toggleDebugMode,
    isEnabled: isDebugMode
  };
  
  // Show helpful message on first load
  console.log('%c💡 Debug Controls Available', 'color: #3b82f6; font-weight: bold; font-size: 14px;');
  console.log('To enable debugging: %cwindow.debug.enable()', 'color: #10b981; font-weight: bold;');
  console.log('To disable debugging: %cwindow.debug.disable()', 'color: #ef4444; font-weight: bold;');
  console.log('To toggle debugging: %cwindow.debug.toggle()', 'color: #f59e0b; font-weight: bold;');
}