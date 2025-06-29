self.addEventListener('push', event => {
    const data = event.data.json();
    console.log('New notification received', data);

    const options = {
        body: data.body,
        icon: 'https://via.placeholder.com/128', // একটি আইকন যোগ করতে পারেন
        badge: 'https://via.placeholder.com/64' // একটি ব্যাজ যোগ করতে পারেন
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});