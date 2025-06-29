// আপনার দেওয়া Public Key
const VAPID_PUBLIC_KEY = 'BKD_sEIB4iPRJY_zMRhMHP-BF_IW_43DW11bRsNOa2FJ9RCzeyAxlqg_xOQTx7GbTvdBe46mZtCC_EMS3rvvBkU';

// URL-safe base64 কে Uint8Array তে রূপান্তর করার ফাংশন
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

// মূল ফাংশন
async function run() {
    if (!('serviceWorker' in navigator)) {
        console.error('Service Worker not supported in this browser.');
        return;
    }

    try {
        console.log('Registering service worker...');
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);

        console.log('Requesting notification permission...');
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log('Notification permission granted.');

            console.log('Getting push subscription...');
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
            console.log('User is subscribed:', subscription);

            console.log('Sending subscription to server...');
            await fetch('/api/save-subscription', {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('Subscription sent to server successfully.');

        } else {
            console.warn('Notification permission was denied.');
        }
    } catch (error) {
        console.error('Service Worker Registration or Subscription failed:', error);
    }
}

run();

// সেন্ড বাটনের জন্য ইভেন্ট লিসেনার
document.getElementById('sendButton').addEventListener('click', async () => {
    const message = document.getElementById('notificationMessage').value;
    if (!message) {
        alert('Please write a message first.');
        return;
    }

    console.log('Sending notification request to server...');
    try {
        const response = await fetch('/api/send-notification', {
            method: 'POST',
            body: JSON.stringify({ message }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            alert('Notification sent successfully!');
            console.log('Server responded with success.');
            document.getElementById('notificationMessage').value = '';
        } else {
            const errorData = await response.json();
            alert('Failed to send notification. Server error.');
            console.error('Server error:', errorData.message);
        }
    } catch (error) {
        console.error('Failed to send notification request:', error);
        alert('Failed to send notification. Check console for errors.');
    }
});