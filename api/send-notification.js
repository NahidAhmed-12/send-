const webpush = require('web-push');
const fs = require('fs/promises');
const path = require('path');

const dbPath = path.resolve('/tmp', 'db.json');

// "export default async function handler" এর পরিবর্তে "module.exports" ব্যবহার করা হয়েছে
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    console.log('Send notification API called.');

    const vapidKeys = {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY,
    };
    
    if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
        console.error("VAPID keys are not set in environment variables.");
        return res.status(500).json({ message: "Server configuration error." });
    }

    webpush.setVapidDetails(
        'mailto:your-email@example.com',
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
                .catch(err => {
                    console.error(`Error sending notification:`, err.statusCode, err.body);
                })
        );
        
        await Promise.all(promises);

        res.status(200).json({ message: 'Notifications sent.' });
    } catch (error) {
        if (error.code === 'ENOENT') {
             console.error('db.json not found. No one has subscribed yet.');
             return res.status(500).json({ message: 'No subscriptions found.' });
        }
        console.error('Failed to send notifications:', error);
        res.status(500).json({ message: 'Failed to send notifications.' });
    }
};