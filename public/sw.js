console.log('Service Worker file loaded.');

self.addEventListener('push', event => {
    console.log('[Service Worker] Push Received.');
    
    try {
        const data = event.data.json();
        console.log('[Service Worker] Notification data:', data);

        const options = {
            body: data.body,
            icon: 'https://via.placeholder.com/128', // একটি আইকন
            badge: 'https://via.placeholder.com/64' // একটি ব্যাজ
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    } catch (e) {
        console.error('[Service Worker] Error processing push event:', e);
    }
});