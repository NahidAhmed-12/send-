const webpush = require('web-push');
const fs = require('fs/promises');
const path = require('path');

const dbPath = path.resolve('/tmp', 'db.json');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    console.log('Send notification API called.');

    // Vercel এর Environment Variables থেকে কী গুলো লোড হবে
    const vapidKeys = {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY,
    };
    
    // কী-গুলো ঠিকভাবে লোড হয়েছে কি না, তা চেক করুন
    if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
        console.error("VAPID keys are not set in environment variables.");
        return res.status(500).json({ message: "Server configuration error." });
    }

    webpush.setVapidDetails(
        'mailto:your-email@example.com', // এখানে একটি ইমেইল দিন
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );

    const { message } = req.body;
    const notificationPayload = JSON.stringify({
        title: 'New Message!',
        body: message,
    });

    try {
        console.log('Reading subscriptions from db...');
        const fileContent = await fs.readFile(dbPath, 'utf-8');
        const data = JSON.parse(fileContent);
        const subscriptions = data.subscriptions;
        
        console.log(`Found ${subscriptions.length} subscriptions to send notification to.`);
        if (subscriptions.length === 0) {
            return res.status(200).json({ message: 'No subscriptions to send notifications to.' });
        }
        
        const promises = subscriptions.map(sub => 
            webpush.sendNotification(sub, notificationPayload)
                .then(response => console.log(`Notification sent to ${sub.endpoint.substring(0, 30)}...`, response.statusCode))
                .catch(err => {
                    console.error(`Error sending to ${sub.endpoint.substring(0, 30)}...`, err.statusCode);
                    // এখানে 410 বা 404 কোড পেলে সাবস্ক্রিপশনটি db থেকে মুছে ফেলা উচিত
                })
        );
        
        await Promise.all(promises);

        res.status(200).json({ message: 'Notifications sent.' });
    } catch (error) {
        console.error('Failed to read subscriptions or send notifications:', error);
        // যদি db.json ফাইলটি না পাওয়া যায়
        if (error.code === 'ENOENT') {
             return res.status(500).json({ message: 'No subscriptions found. Has anyone subscribed?' });
        }
        res.status(500).json({ message: 'Failed to send notifications.' });
    }
}