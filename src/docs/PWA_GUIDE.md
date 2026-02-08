# Progressive Web App (PWA) Guide

Complete guide to PWA features in Oliwonder.

## 📚 Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Service Worker](#service-worker)
4. [Offline Support](#offline-support)
5. [Push Notifications](#push-notifications)
6. [Install Prompt](#install-prompt)
7. [Network Status](#network-status)
8. [Best Practices](#best-practices)

---

## Overview

Oliwonder is a fully-featured Progressive Web App (PWA) that works offline, can be installed on devices, and sends push notifications.

### PWA Features

✅ **Installable** - Add to home screen on mobile & desktop  
✅ **Offline Support** - Works without internet connection  
✅ **Background Sync** - Sync data when connection restored  
✅ **Push Notifications** - Real-time updates  
✅ **Fast Loading** - Service worker caching  
✅ **App-like Experience** - Standalone display mode  

### Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Install Prompt | ✅ | ❌ | iOS only | ✅ |
| Push Notifications | ✅ | ✅ | ✅ (16.4+) | ✅ |
| Background Sync | ✅ | ❌ | ❌ | ✅ |

---

## Installation

### 1. Add Manifest Link

Add to `index.html` `<head>`:

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#6366f1">
<link rel="apple-touch-icon" href="/icons/icon-192x192.png">
```

### 2. Register Service Worker

In `App.tsx`:

```tsx
import { useEffect } from 'react';
import { registerServiceWorker } from './utils/pwa';

function App() {
  useEffect(() => {
    // Register service worker
    registerServiceWorker().then((registration) => {
      console.log('Service Worker registered:', registration);
    });
  }, []);
  
  return <Router>...</Router>;
}
```

### 3. Add Install Prompt

```tsx
import { InstallPrompt, UpdateAvailableBanner } from './components/InstallPrompt';
import { OfflineBanner } from './components/NetworkStatus';

function App() {
  return (
    <>
      {/* PWA Components */}
      <InstallPrompt autoShowDelay={5000} />
      <UpdateAvailableBanner />
      <OfflineBanner />
      
      {/* Your app */}
      <Router>...</Router>
    </>
  );
}
```

---

## Service Worker

### Caching Strategies

The service worker uses different strategies for different resources:

#### 1. Cache First (Images, Fonts)
```javascript
// Try cache first, then network
// Good for static assets that don't change
```

#### 2. Network First (API Calls)
```javascript
// Try network first, fall back to cache
// Good for dynamic data
```

#### 3. Stale While Revalidate (HTML, CSS, JS)
```javascript
// Return cached version immediately
// Update cache in background
// Good for app shell
```

### Cache Configuration

Defined in `/public/service-worker.js`:

```javascript
const CACHE_NAMES = {
  static: 'oliwonder-v1.0.0-static',
  dynamic: 'oliwonder-v1.0.0-dynamic',
  images: 'oliwonder-v1.0.0-images',
  api: 'oliwonder-v1.0.0-api'
};

const CACHE_LIMITS = {
  dynamic: 50,  // Max 50 pages
  images: 100,  // Max 100 images
  api: 50       // Max 50 API responses
};

const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
```

### Manual Cache Control

```tsx
import { clearAllCaches, getCacheSize } from '../utils/pwa';

// Clear all caches
await clearAllCaches();

// Get cache size
const { usage, quota } = await getCacheSize();
console.log(`Using ${usage} of ${quota} bytes`);
```

---

## Offline Support

### Offline Page

Custom offline fallback in `/public/offline.html`:

- Shows when user is offline and page not cached
- Auto-detects when connection restored
- Provides reload button

### Offline Detection

```tsx
import { useNetworkStatus } from '../components/NetworkStatus';

function MyComponent() {
  const { online, offline, effectiveType, saveData } = useNetworkStatus();
  
  if (offline) {
    return <div>You're offline</div>;
  }
  
  if (saveData) {
    return <div>Data saver mode active</div>;
  }
  
  return <div>Online - {effectiveType}</div>;
}
```

### Network Status Components

```tsx
import { 
  OfflineBanner,
  NetworkIndicator,
  ConnectionQuality,
  SaveDataIndicator
} from '../components/NetworkStatus';

// Offline banner at top
<OfflineBanner />

// Small indicator in corner
<NetworkIndicator position="bottom-right" />

// Connection quality
<ConnectionQuality />

// Data saver notice
<SaveDataIndicator />
```

### Background Sync

Queue data when offline, sync when back online:

```tsx
import { registerBackgroundSync } from '../utils/pwa';

async function submitForm(data) {
  try {
    // Try to submit
    await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    // If offline, queue for background sync
    await saveToIndexedDB('pending-submissions', data);
    await registerBackgroundSync('sync-submissions');
    
    toast.info('Saved locally. Will sync when online.');
  }
}
```

---

## Push Notifications

### 1. Request Permission

```tsx
import { requestNotificationPermission } from '../utils/pwa';

async function enableNotifications() {
  const permission = await requestNotificationPermission();
  
  if (permission === 'granted') {
    console.log('Notifications enabled');
  } else {
    console.log('Notifications denied');
  }
}
```

### 2. Subscribe to Push

```tsx
import { subscribeToPushNotifications } from '../utils/pwa';

const VAPID_PUBLIC_KEY = 'your-vapid-public-key';

async function setupPushNotifications() {
  const subscription = await subscribeToPushNotifications(VAPID_PUBLIC_KEY);
  
  if (subscription) {
    // Send subscription to server
    await fetch('/api/push-subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription)
    });
  }
}
```

### 3. Show Local Notification

```tsx
import { showNotification } from '../utils/pwa';

await showNotification('New Message', {
  body: 'You have a new networking match!',
  icon: '/icons/icon-192x192.png',
  badge: '/icons/badge-72x72.png',
  tag: 'new-match',
  data: { url: '/p/abc123' },
  actions: [
    { action: 'view', title: 'View' },
    { action: 'dismiss', title: 'Dismiss' }
  ]
});
```

### 4. Unsubscribe

```tsx
import { unsubscribeFromPushNotifications } from '../utils/pwa';

await unsubscribeFromPushNotifications();
```

### Notification Types

**Session Reminders:**
```javascript
{
  title: 'Session Starting Soon',
  body: 'Your networking session starts in 15 minutes',
  tag: 'session-reminder',
  requireInteraction: true
}
```

**New Matches:**
```javascript
{
  title: 'New Match!',
  body: 'You've been matched with John Doe',
  tag: 'new-match',
  data: { matchId: '123' }
}
```

**Round Updates:**
```javascript
{
  title: 'Round 2 Starting',
  body: 'Please move to Table 5',
  tag: 'round-update',
  vibrate: [200, 100, 200]
}
```

---

## Install Prompt

### Auto Install Prompt

Shows automatically after delay:

```tsx
import { InstallPrompt } from '../components/InstallPrompt';

<InstallPrompt 
  autoShowDelay={5000}     // Show after 5 seconds
  allowDismiss={true}       // User can dismiss
  position="bottom"         // Position on screen
  installText="Install Oliwonder"
/>
```

### Install Button

Manual install button:

```tsx
import { InstallButton } from '../components/InstallPrompt';

<InstallButton 
  variant="default"  // or "outline" or "ghost"
  size="md"          // or "sm" or "lg"
/>
```

### iOS Install Instructions

For iOS Safari users:

```tsx
import { IOSInstallInstructions } from '../components/InstallPrompt';

<IOSInstallInstructions />
```

Shows instructions:
1. Tap Share button
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add" to confirm

### Check Install Status

```tsx
import { isPWA, canInstallPWA } from '../utils/pwa';

// Check if running as PWA
if (isPWA()) {
  console.log('Running as installed PWA');
}

// Check if can be installed
if (canInstallPWA()) {
  console.log('App can be installed');
}
```

---

## Network Status

### Real-time Network Detection

```tsx
import { isOnline, onNetworkChange } from '../utils/pwa';

// Check current status
const online = isOnline();

// Listen to changes
const unsubscribe = onNetworkChange((online) => {
  if (online) {
    console.log('Back online!');
    // Sync pending data
  } else {
    console.log('Went offline');
    // Switch to offline mode
  }
});

// Cleanup
unsubscribe();
```

### Network Information

```tsx
import { getNetworkInfo } from '../utils/pwa';

const info = getNetworkInfo();
console.log(info);
// {
//   type: 'wifi',
//   effectiveType: '4g',
//   downlink: 10,      // Mbps
//   rtt: 50,           // ms
//   saveData: false
// }
```

### Adaptive Loading

Load different content based on connection:

```tsx
function AdaptiveImage({ src }) {
  const { effectiveType, saveData } = useNetworkStatus();
  
  // Low quality for slow connections
  if (effectiveType === '2g' || effectiveType === 'slow-2g' || saveData) {
    return <img src={`${src}?quality=30`} />;
  }
  
  // High quality for fast connections
  return <img src={`${src}?quality=80`} />;
}
```

---

## Best Practices

### 1. Progressive Enhancement

App should work without PWA features:

```tsx
function MyComponent() {
  const [canInstall, setCanInstall] = useState(false);
  
  useEffect(() => {
    // Check if service worker supported
    if ('serviceWorker' in navigator) {
      // PWA features available
      setCanInstall(true);
    }
  }, []);
  
  return (
    <div>
      {/* Core functionality works without PWA */}
      <MainContent />
      
      {/* Enhanced features when available */}
      {canInstall && <InstallButton />}
    </div>
  );
}
```

### 2. Cache Versioning

Update cache version when deploying:

```javascript
// service-worker.js
const CACHE_VERSION = 'oliwonder-v1.0.1'; // Increment on deploy
```

### 3. Offline First

Design features to work offline:

```tsx
async function saveData(data) {
  // Save to IndexedDB first
  await saveToIndexedDB(data);
  
  // Try to sync to server
  if (navigator.onLine) {
    try {
      await fetch('/api/save', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (error) {
      // Will sync via background sync
      registerBackgroundSync('sync-data');
    }
  }
}
```

### 4. User Communication

Tell users about offline capabilities:

```tsx
import { OfflineReadyMessage } from '../components/NetworkStatus';

// Shows once after first install
<OfflineReadyMessage />
```

### 5. Cache Size Management

Monitor and limit cache size:

```tsx
import { getCacheSize } from '../utils/pwa';

const { usage, quota } = await getCacheSize();
const percentUsed = (usage / quota) * 100;

if (percentUsed > 80) {
  // Warn user or clear old caches
  console.warn('Cache almost full');
}
```

### 6. Update Strategy

Handle service worker updates gracefully:

```tsx
import { UpdateAvailableBanner } from '../components/InstallPrompt';

// Shows banner when update available
<UpdateAvailableBanner />

// User clicks "Update" -> page reloads with new version
```

---

## Testing

### Local Testing

1. **Start HTTPS server** (required for service worker):
```bash
npm run dev
```

2. **Open DevTools** → Application tab
3. **Check Service Worker** panel
4. **Test offline mode** - Check "Offline" in Network tab
5. **Clear cache** - "Clear storage" button

### PWA Audit

Use Lighthouse to audit PWA features:

1. Open DevTools → Lighthouse tab
2. Select "Progressive Web App"
3. Click "Generate report"
4. Fix any issues

### Install Testing

**Desktop (Chrome/Edge):**
- Install icon appears in address bar
- Click to install

**Android:**
- "Add to Home Screen" in menu
- Banner may appear automatically

**iOS:**
- Share button → "Add to Home Screen"
- No automatic prompt

---

## Capabilities

Check what's supported:

```tsx
import { getPWACapabilities } from '../utils/pwa';

const capabilities = getPWACapabilities();
console.log(capabilities);
// {
//   serviceWorker: true,
//   pushNotifications: true,
//   notifications: true,
//   backgroundSync: true,
//   periodicBackgroundSync: false,
//   badging: true,
//   share: true,
//   clipboard: true,
//   wakeLock: true,
//   fileSystemAccess: false,
//   webRTC: true,
//   geolocation: true
// }
```

---

## Troubleshooting

### Service Worker Not Registering

1. Check HTTPS (required except localhost)
2. Check browser support
3. Check console for errors
4. Try incognito mode

### Install Prompt Not Showing

1. Must be HTTPS
2. Must have valid manifest
3. Must have service worker
4. User may have dismissed before
5. Try `localStorage.removeItem('install-prompt-dismissed')`

### Notifications Not Working

1. Check permission granted
2. Check service worker registered
3. Check VAPID keys valid
4. Test with local notification first

### Cache Not Working

1. Check service worker active
2. Check cache names match
3. Clear all caches and test
4. Check network tab for cache hits

---

## Production Checklist

- [ ] Service worker registered in App.tsx
- [ ] Manifest.json configured
- [ ] Icons generated (all sizes)
- [ ] Offline page created
- [ ] Install prompt implemented
- [ ] Network status indicators added
- [ ] Cache versioning strategy
- [ ] Push notifications setup (if needed)
- [ ] Lighthouse PWA score > 90
- [ ] Tested on mobile devices
- [ ] Tested offline scenarios
- [ ] Update strategy implemented

---

Last updated: December 2024  
Version: 1.0.0
