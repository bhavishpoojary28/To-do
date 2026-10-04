// FastCapture Suite Service Worker for Mobile Screen & Lock Screen Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for message from main app thread to show a system/mobile screen notification
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_MOBILE_NOTIFICATION') {
    const { title, options } = event.data;
    const notificationOptions = {
      body: options.body || 'Task Reminder',
      icon: options.icon || '/favicon.svg',
      badge: options.badge || '/favicon.svg',
      tag: options.tag || 'task-reminder',
      renotify: true,
      requireInteraction: true,
      vibrate: [300, 100, 400, 100, 500],
      data: options.data || {},
      actions: [
        { action: 'open', title: 'Open Task' }
      ]
    };

    self.registration.showNotification(title, notificationOptions);
  }
});

// Handle tap on the mobile screen notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app window is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
