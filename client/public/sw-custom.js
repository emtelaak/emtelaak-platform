// Custom Service Worker for Push Notifications and Background Sync
// This extends the Workbox-generated service worker

// Import Workbox libraries
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Configure Workbox
workbox.setConfig({
  debug: false
});

// Precaching will be injected by Workbox
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

// Push Notification Handler
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push notification received');
  
  let notificationData = {
    title: 'Emtelaak',
    body: 'You have a new notification',
    icon: '/favicon-192.png',
    badge: '/favicon-192.png',
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || data.message || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || {},
        tag: data.tag || 'default',
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || []
      };
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions
    })
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();

  // Handle action button clicks
  if (event.action) {
    console.log('[Service Worker] Action clicked:', event.action);
    // Handle specific actions here
  }

  // Navigate to the app or specific page
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background Sync Handler
self.addEventListener('sync', function(event) {
  console.log('[Service Worker] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  } else if (event.tag === 'sync-portfolio') {
    event.waitUntil(syncPortfolio());
  }
});

// Sync functions
async function syncTransactions() {
  try {
    console.log('[Service Worker] Syncing transactions...');
    // Get pending transactions from IndexedDB
    const db = await openDatabase();
    const transactions = await getPendingTransactions(db);
    
    if (transactions.length === 0) {
      console.log('[Service Worker] No pending transactions to sync');
      return;
    }

    // Sync each transaction
    for (const transaction of transactions) {
      try {
        const response = await fetch('/api/trpc/transactions.create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transaction)
        });

        if (response.ok) {
          await markTransactionSynced(db, transaction.id);
          console.log('[Service Worker] Transaction synced:', transaction.id);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync transaction:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Background sync failed:', error);
    throw error; // Retry sync
  }
}

async function syncPortfolio() {
  try {
    console.log('[Service Worker] Syncing portfolio data...');
    const response = await fetch('/api/trpc/portfolio.list');
    
    if (response.ok) {
      const data = await response.json();
      // Cache the updated portfolio data
      const cache = await caches.open('api-cache');
      await cache.put('/api/trpc/portfolio.list', new Response(JSON.stringify(data)));
      console.log('[Service Worker] Portfolio synced successfully');
    }
  } catch (error) {
    console.error('[Service Worker] Portfolio sync failed:', error);
    throw error; // Retry sync
  }
}

// IndexedDB helpers (simplified)
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EmtelaakDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingTransactions')) {
        db.createObjectStore('pendingTransactions', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getPendingTransactions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingTransactions'], 'readonly');
    const store = transaction.objectStore('pendingTransactions');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function markTransactionSynced(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingTransactions'], 'readwrite');
    const store = transaction.objectStore('pendingTransactions');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Message Handler for client communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[Service Worker] Loaded with push notification and background sync support');
