const VAPID_PUBLIC_KEY = 'BKD_sEIB4iPRJY_zMRhMHP-BF_IW_43DW11bRsNOa2FJ9RCzeyAxlqg_xOQTx7GbTvdBe46mZtCC_EMS3rvvBkU';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function subscribeAndSave() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        const response = await fetch('/api/save-subscription', {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Failed to save subscription on server.');
        }
        console.log('User subscribed and subscription saved.');
    } catch (error) {
        console.error('Subscription process failed:', error);
    }
}

async function setupPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported');
        return;
    }

    try {
        await navigator.serviceWorker.register('/sw.js');
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            await subscribeAndSave();
        } else {
            console.warn('Notification permission denied.');
        }
    } catch (error) {
        console.error('Service Worker registration failed:', error);
    }
}

document.getElementById('sendButton').addEventListener('click', async () => {
    const message = document.getElementById('notificationMessage').value;
    if (!message) {
        alert('Please write a message.');
        return;
    }
    try {
        const response = await fetch('/api/send-notification', {
            method: 'POST',
            body: JSON.stringify({ message }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Server responded with an error.');
        }
        
        const result = await response.json();
        alert(result.message);

    } catch (error) {
        alert(`Error: ${error.message}`);
        console.error('Failed to send notification:', error);
    }
});

setupPushNotifications();