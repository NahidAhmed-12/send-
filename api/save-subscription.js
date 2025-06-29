const fs = require('fs/promises');
const path = require('path');

// Vercel এর ক্ষেত্রে ফাইল লেখার জন্য /tmp ফোল্ডার ব্যবহার করা নিরাপদ
const dbPath = path.resolve('/tmp', 'db.json');

// ফাংশন: ডাটাবেস ফাইল আছে কি না তা নিশ্চিত করা
async function ensureDbFileExists() {
    try {
        await fs.access(dbPath);
    } catch {
        // ফাইল না থাকলে খালি স্ট্রাকচার দিয়ে তৈরি করুন
        await fs.writeFile(dbPath, JSON.stringify({ subscriptions: [] }, null, 2));
    }
}

// CommonJS ফরম্যাটে এক্সপোর্ট
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        await ensureDbFileExists();
        const newSubscription = req.body;

        const fileContent = await fs.readFile(dbPath, 'utf-8');
        const data = JSON.parse(fileContent);
        
        const exists = data.subscriptions.some(sub => sub.endpoint === newSubscription.endpoint);
        if (!exists) {
            data.subscriptions.push(newSubscription);
            await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
        }
        
        res.status(201).json({ message: 'Subscription saved successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};