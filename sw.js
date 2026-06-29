const CACHE_NAME = 'food-service-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/store.js',
    '/js/app.js',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
});

// A basic notification scheduler using alarms API if available,
// Otherwise relying on the app being open.
let reminderTime = null;

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
        reminderTime = event.data.time;
        // In a real production PWA without a backend, we can only reliably trigger
        // notifications if the service worker wakes up (e.g., periodic sync).
        // Since mobile browsers aggressively suspend SWs, this is a best-effort local timer.
        checkTimeAndNotify();
    }
});

function checkTimeAndNotify() {
    if (!reminderTime) return;

    const now = new Date();
    const [hours, minutes] = reminderTime.split(':');
    
    if (now.getHours() === parseInt(hours) && now.getMinutes() === parseInt(minutes)) {
        self.registration.showNotification("Tomorrow's food reminder is ready.", {
            body: "Tap here to prepare the WhatsApp message.",
            icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%232e7d32'/><text y='60' x='15' fill='white' font-size='40' font-family='sans-serif'>FS</text></svg>",
            vibrate: [200, 100, 200],
            tag: 'food-reminder',
            renotify: true,
            requireInteraction: true
        });
    }

    // Check every minute
    setTimeout(checkTimeAndNotify, 60000);
}

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            // Check if there is already a window/tab open with the target URL
            for (let client of windowClients) {
                if (client.url.includes('/index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
