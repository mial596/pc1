// api/trades.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { ObjectId, Db } from 'mongodb';
import { CatImage } from '../../types.js';
import { resolveProfilePicturesForUsers } from './profile.js';
import { updateMissionProgress } from './friends.js';

async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const decodedToken = await verifyToken(req.headers.authorization);
        const userId = decodedToken.sub;
        const db = await getDb();
        
        switch (req.method) {
            case 'GET':
                return await handleGet(req, res, db, userId);
            case 'POST':
                return await handlePost(req, res, db, userId);
            case 'PUT':
                return await handlePut(req, res, db, userId);
            case 'DELETE':
                return await handleDelete(req, res, db, userId);
            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Trades API error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}

async function handleGet(req: VercelRequest, res: VercelResponse, db: Db, userId: string) {
    const tradesCollection = db.collection('trades');
    const usersCollection = db.collection('users');
    const imagesCollection = db.collection('cat_images');

    const trades = await tradesCollection.find({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
        status: 'pending'
    }).sort({ createdAt: -1 }).toArray();
    
    // Batch fetch user data
    const userIds = [...new Set(trades.flatMap(t => [t.fromUserId, t.toUserId]))];
    const usersCursor = await usersCollection.find({ _id: { $in: userIds } }).project({ username: 1, isVerified: 1, data: {profilePictureId: 1} }).toArray();
    const usersWithPics = await resolveProfilePicturesForUsers(db, usersCursor);
    const userMap = new Map(usersWithPics.map(u => [u._id, u]));

    const result = await Promise.all(trades.map(async (trade) => {
        const [offeredImages, requestedImages] = await Promise.all([
            imagesCollection.find({ id: { $in: trade.offeredImageIds } }).project({_id: 0}).toArray(),
            imagesCollection.find({ id: { $in: trade.requestedImageIds } }).project({_id: 0}).toArray(),
        ]);
        const fromUser = userMap.get(trade.fromUserId);
        const toUser = userMap.get(trade.toUserId);
        return {
            ...trade,
            fromUsername: fromUser?.username || '?',
            fromUserVerified: fromUser?.isVerified || false,
            fromUserProfilePictureUrl: fromUser?.profilePictureUrl,
            toUsername: toUser?.username || '?',
            toUserVerified: toUser?.isVerified || false,
            toUserProfilePictureUrl: toUser?.profilePictureUrl,
            offeredImages,
            requestedImages,
        };
    }));
    
    await usersCollection.updateOne({ _id: userId as any }, { $set: { "data.tradeNotifications": 0 } });

    return res.status(200).json(result);
}

async function handlePost(req: VercelRequest, res: VercelResponse, db: Db, userId: string) {
    const { toUserId, offeredImageIds, requestedImageIds } = req.body;
    if (!toUserId || !Array.isArray(offeredImageIds) || !Array.isArray(requestedImageIds)) {
        return res.status(400).json({ message: "Invalid request body." });
    }
    
    const users = db.collection('users');
    const friendships = db.collection('friendships');
    const fromUser = await users.findOne({ _id: userId as any });
    const toUser = await users.findOne({ _id: toUserId as any });

    if (!fromUser || !toUser) return res.status(404).json({ message: "User not found." });
    
    const isFriendInOldSystem = fromUser.data?.friends?.includes(toUserId);
    const friendship = await friendships.findOne({ $or: [{ user1Id: userId, user2Id: toUserId }, { user1Id: toUserId, user2Id: userId }] });
    if (!friendship && !isFriendInOldSystem) return res.status(403).json({ message: "Can only trade with friends." });
    
    const fromOwns = offeredImageIds.every(id => fromUser.data.unlockedImageIds.includes(id));
    const toOwns = requestedImageIds.every(id => toUser.data.unlockedImageIds.includes(id));
    if (!fromOwns || !toOwns) return res.status(400).json({ message: "Invalid trade items." });

    const newTrade = {
        fromUserId: userId,
        toUserId: toUserId,
        offeredImageIds,
        requestedImageIds,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };

    await db.collection('trades').insertOne(newTrade);
    await updateMissionProgress(friendships, userId, toUserId, 'SEND_TRADE', 1);
    await users.updateOne({ _id: toUserId as any }, { $inc: { "data.tradeNotifications": 1 } });
    
    return res.status(201).json({ success: true });
}

async function handlePut(req: VercelRequest, res: VercelResponse, db: Db, userId: string) {
    const { tradeId, action } = req.body;
    if (!tradeId || !['accept', 'reject'].includes(action)) return res.status(400).json({ message: "Invalid data." });
    
    const trades = db.collection('trades');
    const trade = await trades.findOne({ _id: new ObjectId(tradeId), toUserId: userId, status: 'pending' });
    if (!trade) return res.status(404).json({ message: "Trade not found or not actionable." });

    if (action === 'reject') {
        await trades.updateOne({ _id: new ObjectId(tradeId) }, { $set: { status: 'rejected' } });
        return res.status(200).json({ success: true });
    }
    
    const users = db.collection('users');
    const fromUser = await users.findOne({ _id: trade.fromUserId as any });
    const toUser = await users.findOne({ _id: trade.toUserId as any });
    
    const fromOwns = trade.offeredImageIds.every((id:number) => fromUser?.data.unlockedImageIds.includes(id));
    const toOwns = trade.requestedImageIds.every((id:number) => toUser?.data.unlockedImageIds.includes(id));
    if(!fromOwns || !toOwns) {
        await trades.updateOne({ _id: new ObjectId(tradeId) }, { $set: { status: 'rejected', reason: 'Item no longer available.' } });
        return res.status(409).json({ message: 'Trade failed, one or more items no longer available.' });
    }
    
    await users.updateOne({ _id: fromUser?._id }, {
        $pullAll: { "data.unlockedImageIds": trade.offeredImageIds },
        $addToSet: { "data.unlockedImageIds": { $each: trade.requestedImageIds } }
    });
     await users.updateOne({ _id: toUser?._id }, {
        $pullAll: { "data.unlockedImageIds": trade.requestedImageIds },
        $addToSet: { "data.unlockedImageIds": { $each: trade.offeredImageIds } }
    });
    
    await trades.updateOne({ _id: new ObjectId(tradeId) }, { $set: { status: 'accepted' } });
    
    return res.status(200).json({ success: true });
}

async function handleDelete(req: VercelRequest, res: VercelResponse, db: Db, userId: string) {
    const { tradeId } = req.body;
    if (!tradeId) return res.status(400).json({ message: "tradeId is required." });

    const trades = db.collection('trades');
    const result = await trades.updateOne(
        { _id: new ObjectId(tradeId), fromUserId: userId, status: 'pending' },
        { $set: { status: 'cancelled' } }
    );
    
    if(result.matchedCount === 0) return res.status(404).json({message: "Trade not found or not cancellable."});
    
    return res.status(200).json({ success: true });
}

export default handler;