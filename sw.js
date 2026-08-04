const CACHE_NAME = 'food-service-v23';
const ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/store.js',
    '/js/app.js',
    '/manifest.json',
    '/icon.png'
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

let reminderTime = null;
let lastSentDateStr = null;
let appOpenedAfterNotificationStr = null;

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
    } else if (event.data && event.data.type === 'CANCEL_NOTIFICATION') {
        reminderTime = null;
        if (checkTimer) clearTimeout(checkTimer);
    } else if (event.data && event.data.type === 'APP_OPENED') {
        const todayStr = event.data.date || getTodayDateStr();
        if (reminderTime) {
            const now = new Date();
            const [hours, minutes] = reminderTime.split(':');
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const targetMinutes = parseInt(hours) * 60 + parseInt(minutes);
            
            // If the app is opened after the target time, stop nagging
            if (currentMinutes >= targetMinutes) {
                appOpenedAfterNotificationStr = todayStr;
                // Close any existing notifications
                self.registration.getNotifications().then(notifications => {
                    notifications.forEach(n => n.close());
                });
            }
        }
    }
});

let checkTimer = null;

function checkTimeAndNotify() {
    if (!reminderTime) return;

    if (checkTimer) clearTimeout(checkTimer);

    const now = new Date();
    const [hours, minutes] = reminderTime.split(':');
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = parseInt(hours) * 60 + parseInt(minutes);
    const todayStr = getTodayDateStr();
    
    // Only fire if it's the exact minute or past it, and we haven't sent it today
    // AND app hasn't been opened after the target time today
    if (currentMinutes >= targetMinutes && lastSentDateStr !== todayStr && appOpenedAfterNotificationStr !== todayStr) {
        self.registration.showNotification("Tomorrow's food reminder is ready.", {
            body: "Tap here to prepare the WhatsApp message.",
            icon: "/icon.png",
            vibrate: [200, 100, 200],
            tag: 'food-reminder',
            renotify: true,
            requireInteraction: true,
            actions: [
                { action: 'stop_alarm', title: '🔕 Stop Alarm' }
            ]
        });
    }

    // Check every minute
    checkTimer = setTimeout(checkTimeAndNotify, 60000);
}

// The Nagging Loop is now handled by the 1-minute checkTimeAndNotify loop above
self.addEventListener('notificationclose', event => {
    // We don't need to do anything here because checkTimeAndNotify 
    // will just re-trigger the notification in a minute unless APP_OPENED or MARK_SENT is received.
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'stop_alarm') {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then(windowClients => {
                for (let client of windowClients) {
                    client.postMessage({ type: 'STOP_ALARM' });
                }
            })
        );
        return;
    }

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
