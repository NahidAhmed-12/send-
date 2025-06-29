const fs = require('fs');
const path = require('path');

// db.json ফাইলের পাথ বের করা
const dbPath = path.resolve(process.cwd(), 'db.json');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const newSubscription = req.body;

    try {
        // বর্তমান সাবস্ক্রিপশনগুলো পড়া
        let data = { subscriptions: [] };
        if (fs.existsSync(dbPath)) {
            const fileContent = fs.readFileSync(dbPath, 'utf-8');
            data = JSON.parse(fileContent);
        }

        // নতুন সাবস্ক্রিপশন যোগ করা (যদি আগে থেকে না থাকে)
        const exists = data.subscriptions.some(sub => sub.endpoint === newSubscription.endpoint);
        if (!exists) {
            data.subscriptions.push(newSubscription);
            fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        }

        res.status(201).json({ message: 'Subscription saved.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to save subscription.' });
    }
}