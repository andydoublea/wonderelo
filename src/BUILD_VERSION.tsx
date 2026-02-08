// Build version identifier for debugging deployment issues
// This file should be updated on each significant change to verify production deployment

export const BUILD_VERSION = '6.33.0-timecontrol-seconds';
export const BUILD_TIMESTAMP = new Date().toISOString(); // Auto-updates on each build
export const BUILD_FEATURES = [
  '⏱️ NEW: TimeControl now supports seconds input (Hours, Minutes, Seconds)',
  '⏱️ IMPROVED: Three separate number inputs for precise time control',
  '⏱️ IMPROVED: Better UX with labeled inputs and validation',
  '⏰ Previous: Simulated time support - TimeControl now syncs with backend',
  '⏰ Previous: Backend helper getCurrentTime(c) reads simulatedTime query param',
  '⏰ Previous: Auto-update status to unconfirmed when confirmation window expires',
  '💾 Previous: TimeControl remembers last set time in localStorage',
  '🎨 Previous: Rearranged floating UI elements to prevent overlap'
];

// Log build version with prominent styling
console.log('');
console.log('%c🏗️ ========================================', 'color: #10b981; font-weight: bold; font-size: 14px');
console.log('%c🏗️ BUILD VERSION INFORMATION', 'color: #10b981; font-weight: bold; font-size: 14px');
console.log('%c🏗️ ========================================', 'color: #10b981; font-weight: bold; font-size: 14px');
console.log('%cVersion:', 'font-weight: bold', BUILD_VERSION);
console.log('%cTimestamp:', 'font-weight: bold', BUILD_TIMESTAMP);
console.log('%cEnvironment:', 'font-weight: bold', window.location.hostname);
console.log('');
console.log('%c✨ Features in this build:', 'font-weight: bold; color: #8b5cf6');
BUILD_FEATURES.forEach((feature, index) => {
  console.log(`  ${index + 1}. ${feature}`);
});
console.log('');
console.log('%c💡 Deployment check:', 'font-weight: bold; color: #3b82f6');
console.log('  Compare version between wonderelo.com and Figma Make preview.');
console.log('  If versions match, you\'re using the same code.');
console.log('  Look for floating version badge in bottom-right corner →');
console.log('');