const VAPID_PUBLIC_KEY = 'BKD_sEIB4iPRJY_zMRhMHP-BF_IW_43DW11bRsNOa2FJ9RCzeyAxlqg_xOQTx7GbTvdBe46mZtCC_EMS3rvvBkU'; // আপনার Public VAPID কী এখানে দিন

// URL-safe base64 কে Uint8Array তে রূপান্তর করার ফাংশন
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// মূল ফাংশন
async function run() {
    // প্রথমে সার্ভিস ওয়ার্কার রেজিস্টার করি
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered successfully.');

            // নোটিফিকেশনের পারমিশন চাই
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Notification permission granted.');

                // Push ম্যানেজার থেকে সাবস্ক্রিপশন নিই
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
                console.log('User is subscribed:', subscription);

                // সাবস্ক্রিপশনটি আমাদের সার্ভারে পাঠাই
                await fetch('/api/save-subscription', {
                    method: 'POST',
                    body: JSON.stringify(subscription),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                console.log('Subscription sent to server.');
            } else {
                console.warn('Notification permission denied.');
            }
        } catch (error) {
            console.error('Service Worker or Subscription failed:', error);
        }
    }
}

run();

// সেন্ড বাটনে ক্লিক করলে নোটিফিকেশন পাঠানোর রিকোয়েস্ট যাবে
document.getElementById('sendButton').addEventListener('click', async () => {
    const message = document.getElementById('notificationMessage').value;
    if (!message) {
        alert('Please write a message first.');
        return;
    }

    try {
        await fetch('/api/send-notification', {
            method: 'POST',
            body: JSON.stringify({ message }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        alert('Notification sent successfully!');
        document.getElementById('notificationMessage').value = '';
    } catch (error) {
        console.error('Failed to send notification:', error);
        alert('Failed to send notification.');
    }
});