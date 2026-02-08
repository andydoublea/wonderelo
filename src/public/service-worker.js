/**
 * Oliwonder Service Worker
 * Handles offline caching, background sync, and push notifications
 */

const CACHE_VERSION = 'oliwonder-v1.0.0';
const CACHE_NAMES = {
  static: `${CACHE_VERSION}-static`,
  dynamic: `${CACHE_VERSION}-dynamic`,
  images: `${CACHE_VERSION}-images`,
  api: `${CACHE_VERSION}-api`
};

// Files to cache immediately on install
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // Add your main JS/CSS files here
  // These will be auto-discovered by the build tool
];

// Maximum cache sizes
const CACHE_LIMITS = {
  dynamic: 50,
  images: 100,
  api: 50
};

// API cache duration (5 minutes)
const API_CACHE_DURATION = 5 * 60 * 1000;

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete caches that don't match current version
              return Object.values(CACHE_NAMES).indexOf(cacheName) === -1;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event - Handle network requests with caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests (except images)
  if (url.origin !== self.location.origin && !request.destination === 'image') {
    return;
  }
  
  // Choose caching strategy based on request type
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.images));
  } else if (url.pathname.startsWith('/api/') || url.pathname.includes('supabase.co')) {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.api));
  } else if (request.destination === 'document' || request.destination === 'script' || request.destination === 'style') {
    event.respondWith(staleWhileRevalidateStrategy(request, CACHE_NAMES.static));
  } else {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.dynamic));
  }
});

/**
 * Cache First Strategy
 * Use cached version if available, otherwise fetch from network
 * Good for: Images, fonts, static assets
 */
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      console.log('[SW] Caching new resource:', request.url);
      cache.put(request, response.clone());
      limitCacheSize(cacheName, CACHE_LIMITS.images);
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return new Response('Offline - resource not available', { status: 503 });
  }
}

/**
 * Network First Strategy
 * Try network first, fall back to cache
 * Good for: API calls, dynamic content
 */
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      const responseClone = response.clone();
      
      // Add timestamp for cache expiration
      const headers = new Headers(responseClone.headers);
      headers.append('sw-cached-at', Date.now().toString());
      
      const cachedResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
      limitCacheSize(cacheName, CACHE_LIMITS.api);
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cached = await cache.match(request);
    
    if (cached) {
      // Check if cache is expired
      const cachedAt = cached.headers.get('sw-cached-at');
      if (cachedAt && Date.now() - parseInt(cachedAt) > API_CACHE_DURATION) {
        console.log('[SW] Cache expired for:', request.url);
      } else {
        console.log('[SW] Using cached response:', request.url);
        return cached;
      }
    }
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) return offlinePage;
    }
    
    return new Response('Offline - no cached version available', { status: 503 });
  }
}

/**
 * Stale While Revalidate Strategy
 * Return cached version immediately, update cache in background
 * Good for: HTML, CSS, JS files
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);
  
  return cached || fetchPromise;
}

/**
 * Limit cache size
 */
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    // Delete oldest entries
    const toDelete = keys.length - maxItems;
    for (let i = 0; i < toDelete; i++) {
      await cache.delete(keys[i]);
    }
  }
}

/**
 * Background Sync Event
 * Sync data when connection is restored
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-registrations') {
    event.waitUntil(syncRegistrations());
  } else if (event.tag === 'sync-contacts') {
    event.waitUntil(syncContacts());
  }
});

async function syncRegistrations() {
  // Get pending registrations from IndexedDB
  // Send to server
  // Clear from IndexedDB on success
  console.log('[SW] Syncing registrations...');
  
  try {
    const pendingData = await getFromIndexedDB('pending-registrations');
    
    if (pendingData && pendingData.length > 0) {
      for (const registration of pendingData) {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registration)
        });
        
        if (response.ok) {
          await removeFromIndexedDB('pending-registrations', registration.id);
          console.log('[SW] Synced registration:', registration.id);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error; // Re-throw to retry
  }
}

async function syncContacts() {
  console.log('[SW] Syncing contacts...');
  // Similar to syncRegistrations
}

/**
 * Push Notification Event
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'Oliwonder';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.image,
    data: data.data || {},
    actions: data.actions || [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Notification Click Event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

/**
 * Message Event - Communication with app
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CACHE_URLS') {
    caches.open(CACHE_NAMES.dynamic)
      .then((cache) => cache.addAll(event.data.urls));
  } else if (event.data.type === 'CLEAR_CACHE') {
    Promise.all(
      Object.values(CACHE_NAMES).map((cacheName) => caches.delete(cacheName))
    ).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

/**
 * IndexedDB helpers
 */
async function getFromIndexedDB(storeName) {
  // Simplified - implement full IndexedDB logic
  return [];
}

async function removeFromIndexedDB(storeName, id) {
  // Simplified - implement full IndexedDB logic
  return true;
}

console.log('[SW] Service worker loaded');
