// Loaded by the Workbox service worker (importScripts). Shows server pushes and opens the app.
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'LOCK_IN', {
      body: data.body || '',
      tag: data.tag || 'lockin',
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      data: { url: './' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) if ('focus' in c) return c.focus()
      return self.clients.openWindow(event.notification.data && event.notification.data.url ? event.notification.data.url : './')
    }),
  )
})
