import { debugLog, errorLog } from './debug';

/**
 * PWA Utilities
 * Service Worker, Push Notifications, Install Prompt
 */

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return null;
  }
  
  // Skip in Figma preview/iframe environments
  if (window.location.hostname.includes('figma')) {
    debugLog('PWA: Skipping Service Worker in Figma preview environment');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });
    
    debugLog('Service Worker registered:', registration.scope);
    
    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          debugLog('New Service Worker available');
          // Notify user about update
          notifyServiceWorkerUpdate();
        }
      });
    });
    
    return registration;
  } catch (error) {
    errorLog('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();
    debugLog('Service Worker unregistered:', success);
    return success;
  } catch (error) {
    errorLog('Service Worker unregistration failed:', error);
    return false;
  }
}

/**
 * Notify user about service worker update
 */
function notifyServiceWorkerUpdate() {
  // You can integrate with your toast/notification system
  const updateAvailable = window.confirm(
    'A new version of Wonderelo is available. Reload to update?'
  );
  
  if (updateAvailable) {
    window.location.reload();
  }
}

/**
 * Skip waiting and activate new service worker
 */
export async function skipWaitingServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  
  const registration = await navigator.serviceWorker.ready;
  
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

/**
 * Check if app is running as PWA
 */
export function isPWA(): boolean {
  // Check if running in standalone mode
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Check if installed on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = (navigator as any).standalone === true;
  
  return standalone || (isIOS && isStandalone);
}

/**
 * Check if app can be installed
 */
export function canInstallPWA(): boolean {
  // BeforeInstallPrompt event indicates installability
  return 'BeforeInstallPromptEvent' in window || 'onbeforeinstallprompt' in window;
}

/**
 * PWA install prompt manager
 */
class InstallPromptManager {
  private deferredPrompt: any = null;
  private listeners: Set<(canInstall: boolean) => void> = new Set();
  
  constructor() {
    if (typeof window === 'undefined') return;
    
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      debugLog('Install prompt available');
      this.notifyListeners(true);
    });
    
    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      debugLog('App installed');
      this.deferredPrompt = null;
      this.notifyListeners(false);
    });
  }
  
  /**
   * Check if install prompt is available
   */
  isAvailable(): boolean {
    return this.deferredPrompt !== null;
  }
  
  /**
   * Show install prompt
   */
  async show(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.warn('Install prompt not available');
      return false;
    }
    
    try {
      // Show prompt
      this.deferredPrompt.prompt();
      
      // Wait for user choice
      const { outcome } = await this.deferredPrompt.userChoice;
      
      debugLog('Install prompt outcome:', outcome);
      
      // Clear prompt
      this.deferredPrompt = null;
      this.notifyListeners(false);
      
      return outcome === 'accepted';
    } catch (error) {
      errorLog('Install prompt error:', error);
      return false;
    }
  }
  
  /**
   * Subscribe to install availability changes
   */
  subscribe(callback: (canInstall: boolean) => void): () => void {
    this.listeners.add(callback);
    // Call immediately with current state
    callback(this.isAvailable());
    
    return () => {
      this.listeners.delete(callback);
    };
  }
  
  private notifyListeners(canInstall: boolean) {
    this.listeners.forEach(callback => callback(canInstall));
  }
}

export const installPromptManager = new InstallPromptManager();

/**
 * Push notification utilities
 */

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  
  try {
    const permission = await Notification.requestPermission();
    debugLog('Notification permission:', permission);
    return permission;
  } catch (error) {
    errorLog('Notification permission error:', error);
    return 'denied';
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return null;
  }
  
  try {
    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }
    
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });
    
    debugLog('Push subscription created:', subscription.endpoint);
    
    return subscription;
  } catch (error) {
    errorLog('Push subscription error:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      const success = await subscription.unsubscribe();
      debugLog('Push unsubscribed:', success);
      return success;
    }
    
    return true;
  } catch (error) {
    errorLog('Push unsubscription error:', error);
    return false;
  }
}

/**
 * Get current push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    errorLog('Get push subscription error:', error);
    return null;
  }
}

/**
 * Show local notification
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    // Fallback to browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      ...options
    });
  } catch (error) {
    errorLog('Show notification error:', error);
  }
}

/**
 * Background sync utilities
 */

/**
 * Register background sync
 */
export async function registerBackgroundSync(tag: string): Promise<void> {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.warn('Background Sync not supported');
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    await (registration as any).sync.register(tag);
    debugLog('Background sync registered:', tag);
  } catch (error) {
    errorLog('Background sync error:', error);
  }
}

/**
 * Cache management
 */

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }
  
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    debugLog('All caches cleared');
  } catch (error) {
    errorLog('Clear caches error:', error);
  }
}

/**
 * Get cache size estimate
 */
export async function getCacheSize(): Promise<{ usage: number; quota: number }> {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    return { usage: 0, quota: 0 };
  }
  
  try {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0
    };
  } catch (error) {
    errorLog('Get cache size error:', error);
    return { usage: 0, quota: 0 };
  }
}

/**
 * Helper: Convert VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Check PWA capabilities
 */
export function getPWACapabilities() {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window,
    notifications: 'Notification' in window,
    backgroundSync: 'SyncManager' in window,
    periodicBackgroundSync: 'PeriodicSyncManager' in window,
    badging: 'setAppBadge' in navigator,
    share: 'share' in navigator,
    clipboard: 'clipboard' in navigator,
    wakeLock: 'wakeLock' in navigator,
    fileSystemAccess: 'showOpenFilePicker' in window,
    webRTC: 'RTCPeerConnection' in window,
    geolocation: 'geolocation' in navigator
  };
}

/**
 * Network status utilities
 */

/**
 * Check online status
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listen to network status changes
 */
export function onNetworkChange(callback: (online: boolean) => void): () => void {
  const onlineHandler = () => callback(true);
  const offlineHandler = () => callback(false);
  
  window.addEventListener('online', onlineHandler);
  window.addEventListener('offline', offlineHandler);
  
  return () => {
    window.removeEventListener('online', onlineHandler);
    window.removeEventListener('offline', offlineHandler);
  };
}

/**
 * Get network information
 */
export function getNetworkInfo() {
  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
  
  if (!connection) {
    return {
      type: 'unknown',
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false
    };
  }
  
  return {
    type: connection.type || 'unknown',
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
    saveData: connection.saveData || false
  };
}