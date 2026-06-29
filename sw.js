const CACHE_NAME = 'food-service-v2';
const ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/store.js',
    '/js/app.js',
    '/manifest.json'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
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
let lastSentDateStr = null;

// Helper to get today's date str in local timezone
function getTodayDateStr() {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
}

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
        reminderTime = event.data.time;
        if (event.data.lastSentDate) {
            lastSentDateStr = event.data.lastSentDate;
        }
        checkTimeAndNotify();
    } else if (event.data && event.data.type === 'MARK_SENT') {
        lastSentDateStr = event.data.date;
    }
});

function checkTimeAndNotify() {
    if (!reminderTime) return;

    const now = new Date();
    const [hours, minutes] = reminderTime.split(':');
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = parseInt(hours) * 60 + parseInt(minutes);
    const todayStr = getTodayDateStr();
    
    // Only fire if it's the exact minute or past it, and we haven't sent it today
    if (currentMinutes >= targetMinutes && lastSentDateStr !== todayStr) {
        // If it's exactly the minute, or we just woke up and missed it, we trigger it once.
        // We use 'requireInteraction' so it stays on screen.
        self.registration.showNotification("Tomorrow's food reminder is ready.", {
            body: "Tap here to prepare the WhatsApp message.",
            icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23ff6b6b'/><text y='60' x='15' fill='white' font-size='40' font-family='sans-serif'>FS</text></svg>",
            vibrate: [200, 100, 200],
            tag: 'food-reminder',
            renotify: true,
            requireInteraction: true
        });
    }

    // Check every minute
    setTimeout(checkTimeAndNotify, 60000);
}

// The Nagging Loop
self.addEventListener('notificationclose', event => {
    const todayStr = getTodayDateStr();
    
    // If they dismissed the reminder, and it still hasn't been sent
    if (lastSentDateStr !== todayStr) {
        setTimeout(() => {
            self.registration.showNotification("Please send the message to the providers..", {
                body: "They are waiting. Tap here to open and send the WhatsApp reminder.",
                icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23ee5253'/><text y='60' x='15' fill='white' font-size='40' font-family='sans-serif'>FS</text></svg>",
                vibrate: [500, 200, 500, 200, 500],
                tag: 'food-reminder-nag',
                renotify: true,
                requireInteraction: true
            });
        }, 300000); // Nag 5 minutes later
    }
});

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
