// api/codes.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { Db } from 'mongodb';

async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const decodedToken = await verifyToken(req.headers.authorization);
        const userId = decodedToken.sub;
        const db = await getDb();
        const { code } = req.body;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({ message: "Código no proporcionado." });
        }

        const codesCollection = db.collection('codes');
        const codeDoc = await codesCollection.findOne({ code: code.trim().toUpperCase() });

        if (!codeDoc) {
            return res.status(404).json({ message: "El código no es válido." });
        }

        if (codeDoc.isUsed) {
            return res.status(409).json({ message: "Este código ya ha sido canjeado." });
        }

        // Mark code as used and add coins to user
        const usersCollection = db.collection('users');
        const transactionsCollection = db.collection('transactions');

        const session = (db.client).startSession();

        try {
            await session.withTransaction(async () => {
                await codesCollection.updateOne(
                    { _id: codeDoc._id },
                    { $set: { isUsed: true, usedBy: userId, usedAt: new Date().toISOString() } },
                    { session }
                );

                await usersCollection.updateOne(
                    { _id: userId as any },
                    { $inc: { "data.coins": codeDoc.coins } },
                    { session }
                );

                await transactionsCollection.insertOne({
                    userId: userId,
                    date: new Date().toISOString(),
                    description: `Código canjeado: ${codeDoc.code}`,
                    amount: codeDoc.coins,
                }, { session });
            });
        } finally {
            await session.endSession();
        }

        return res.status(200).json({ success: true, coinsAdded: codeDoc.coins });

    } catch (error) {
        console.error('Code redemption API error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}

export default handler;