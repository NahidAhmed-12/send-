const webpush = require('web-push');
const fs = require('fs/promises');
const path = require('path');

const dbPath = path.resolve('/tmp', 'db.json');

// CommonJS ফরম্যাটে এক্সপোর্ট
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const vapidKeys = {
            publicKey: process.env.VAPID_PUBLIC_KEY,
            privateKey: process.env.VAPID_PRIVATE_KEY,
        };

        if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
            return res.status(500).json({ message: "VAPID keys are not configured on the server." });
        }

        webpush.setVapidDetails(
            'mailto:your-email@example.com',
            vapidKeys.publicKey,
            vapidKeys.privateKey
        );

        const { message } = req.body;
        const notificationPayload = JSON.stringify({
            title: 'New Notification',
            body: message,
        });

        const fileContent = await fs.readFile(dbPath, 'utf-8');
        const data = JSON.parse(fileContent);
        const subscriptions = data.subscriptions;

        if (subscriptions.length === 0) {
            return res.status(200).json({ message: 'No active subscriptions to send notifications to.' });
        }
        
        const promises = subscriptions.map(sub => 
            webpush.sendNotification(sub, notificationPayload).catch(err => {
                console.error(`Failed to send to one subscription: ${err.statusCode}`);
            })
        );
        
        await Promise.all(promises);

        res.status(200).json({ message: 'Notifications sent successfully.' });
    } catch (error) {
        if (error.code === 'ENOENT') {
             return res.status(404).json({ message: 'Subscription database not found. Has anyone subscribed yet?' });
        }
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};