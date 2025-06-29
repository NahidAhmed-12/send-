const fs = require('fs/promises');
const path = require('path');

// Vercel এর ক্ষেত্রে ফাইল লেখার জন্য /tmp ফোল্ডার ব্যবহার করা নিরাপদ
const dbPath = path.resolve('/tmp', 'db.json');

async function ensureDbFileExists() {
    try {
        await fs.access(dbPath);
    } catch {
        // ফাইল না থাকলে খালি স্ট্রাকচার দিয়ে তৈরি করুন
        await fs.writeFile(dbPath, JSON.stringify({ subscriptions: [] }, null, 2));
        console.log('db.json created in /tmp directory');
    }
}

// "export default async function handler" এর পরিবর্তে "module.exports" ব্যবহার করা হয়েছে
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    await ensureDbFileExists();
    const newSubscription = req.body;
    console.log('Received new subscription to save:', newSubscription.endpoint);

    try {
        const fileContent = await fs.readFile(dbPath, 'utf-8');
        const data = JSON.parse(fileContent);
        
        const exists = data.subscriptions.some(sub => sub.endpoint === newSubscription.endpoint);
        if (!exists) {
            data.subscriptions.push(newSubscription);
            await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
            console.log('Subscription saved successfully.');
        } else {
            console.log('Subscription already exists.');
        }

        res.status(201).json({ message: 'Subscription saved.' });
    } catch (error) {
        console.error('Failed to save subscription:', error);
        res.status(500).json({ message: 'Internal Server Error.' });
    }
};