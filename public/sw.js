self.addEventListener('push', event => {
    try {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: 'https://via.placeholder.com/128'
        };
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    } catch (e) {
        console.error('Push event error:', e);
    }
});