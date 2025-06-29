const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

// db.json ফাইলের পাথ
const dbPath = path.resolve(process.cwd(), 'db.json');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // Vercel এর Environment Variables থেকে কী গুলো লোড হবে
    const vapidKeys = {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY,
    };

    webpush.setVapidDetails(
        'mailto:your-email@example.com', // আপনার ইমেইল দিন
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );

    const { message } = req.body;
    const notificationPayload = JSON.stringify({
        title: 'New Notification!',
        body: message,
    });

    try {
        // সব সাবস্ক্রিপশন লোড করুন
        const fileContent = fs.readFileSync(dbPath, 'utf-8');
        const data = JSON.parse(fileContent);
        const subscriptions = data.subscriptions;

        // প্রত্যেক সাবস্ক্রাইবারকে নোটিফিকেশন পাঠান
        const promises = subscriptions.map(sub =>
            webpush.sendNotification(sub, notificationPayload).catch(err => {
                // যদি সাবস্ক্রিপশন inválid হয় (যেমন ইউজার আনইন্সটল করেছে), তাহলে তাকে ডাটাবেস থেকে মুছে ফেলা উচিত
                if (err.statusCode === 410) {
                    console.log('Subscription expired or invalid:', sub.endpoint);
                    // এখানে সাবস্ক্রিপশন মুছে ফেলার কোড যোগ করতে পারেন
                } else {
                    console.error('Error sending notification:', err);
                }
            })
        );
        
        await Promise.all(promises);

        res.status(200).json({ message: 'Notifications sent successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send notifications.' });
    }
}