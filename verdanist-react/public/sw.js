self.addEventListener('push', function (event) {
  if (event.data) {
    let payload;
    try {
      payload = event.data.json();
    } catch (e) {
      payload = { title: 'Verdanist Alert', body: event.data.text() };
    }

    const title = payload.title || 'Verdanist Alert';
    const options = {
      body: payload.body || 'Perubahan kondisi kebun',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      requireInteraction: payload.requireInteraction || false,
      data: payload.data || {}
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  // Attempt to focus or open the app window
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
