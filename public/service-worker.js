// service-worker.js
const CACHE_NAME = 'pharmacy-pos-v1'
const STATIC_ASSETS = [
  '/',
  '/cashier',
  '/inventory',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
]

const API_CACHE_NAME = 'pharmacy-api-v1'
const API_URLS = [
  '/api/products',
  '/api/inventory',
  '/api/customers',
  '/api/sales'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS)
      }),
      caches.open(API_CACHE_NAME)
    ])
  )
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  // Take control of all clients
  self.clients.claim()
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Handle static assets with cache-first strategy
  if (STATIC_ASSETS.includes(url.pathname) || request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // Handle navigation requests with network-first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request))
    return
  }

  // Default to network-first for everything else
  event.respondWith(networkFirstStrategy(request))
})

// Network-first strategy (for API calls and dynamic content)
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request)
    
    // Cache successful API responses
    if (request.url.includes('/api/') && response.status === 200) {
      const cache = await caches.open(API_CACHE_NAME)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Fallback to cache
    const cache = await caches.open(request.url.includes('/api/') ? API_CACHE_NAME : CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html')
    }
    
    throw error
  }
}

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const response = await fetch(request)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    throw error
  }
}

// Navigation strategy (for page navigation)
async function navigationStrategy(request) {
  try {
    const response = await fetch(request)
    return response
  } catch (error) {
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return cached home page as fallback
    return cache.match('/')
  }
}

// Background sync for offline sales
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sales') {
    event.waitUntil(syncOfflineSales())
  }
})

async function syncOfflineSales() {
  try {
    // Get offline sales from IndexedDB
    const db = await openDB()
    const transaction = db.transaction(['offline-sales'], 'readonly')
    const store = transaction.objectStore('offline-sales')
    const offlineSales = await store.getAll()
    
    // Sync each sale
    for (const sale of offlineSales) {
      try {
        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sale.data)
        })
        
        if (response.ok) {
          // Remove synced sale from offline storage
          const deleteTransaction = db.transaction(['offline-sales'], 'readwrite')
          const deleteStore = deleteTransaction.objectStore('offline-sales')
          await deleteStore.delete(sale.id)
        }
      } catch (error) {
        console.error('Failed to sync sale:', sale.id, error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Helper function to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pharmacy-pos-db', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // Create offline sales store
      if (!db.objectStoreNames.contains('offline-sales')) {
        const salesStore = db.createObjectStore('offline-sales', { keyPath: 'id' })
        salesStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      data: data.data,
      actions: [
        {
          action: 'open',
          title: 'Open App'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  }
})