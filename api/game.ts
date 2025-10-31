// api/game.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { updateMissionProgress } from './friends.js';
import { Db } from 'mongodb';

async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const decodedToken = await verifyToken(req.headers.authorization);
        const userId = decodedToken.sub;
        const db = await getDb();

        if (req.method === 'POST') {
            const { action, results } = req.body;
            if (action === 'saveResults') {
                return await saveGameResults(res, db, userId, results);
            }
        }
        
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);

    } catch (error) {
        console.error('Game API error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}

async function saveGameResults(res: VercelResponse, db: Db, userId: string, results: { coinsEarned: number; xpEarned: number }) {
    if (!results || typeof results.coinsEarned !== 'number' || typeof results.xpEarned !== 'number') {
        return res.status(400).json({ message: "Invalid game results." });
    }

    const users = db.collection('users');
    const friendships = db.collection('friendships');
    
    // Update player's own stats
    await users.updateOne({ _id: userId as any }, {
        $inc: {
            "data.coins": results.coinsEarned,
            "data.playerStats.xp": results.xpEarned
        }
    });

    // Get all friendships for the current user
    const userFriendships = await friendships.find({ $or: [{ user1Id: userId }, { user2Id: userId }] }).toArray();

    for (const friendship of userFriendships) {
        const friendId = friendship.user1Id === userId ? friendship.user2Id : friendship.user1Id;
        
        // 1. Distribute coin bonus to friend
        const bonusPercentage = Math.min(1 + (friendship.level - 1) * 0.666, 7) / 100;
        const bonusCoins = Math.floor(results.coinsEarned * bonusPercentage);
        if (bonusCoins > 0) {
            await users.updateOne({ _id: friendId as any }, { $inc: { "data.coins": bonusCoins } });
        }
        
        // 2. Update 'PLAY_GAMES' mission progress
        await updateMissionProgress(friendships, userId, friendId, 'PLAY_GAMES', 1);
    }
    
    return res.status(200).json({ success: true });
}

export default handler;