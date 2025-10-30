// api/friends.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { FriendData } from '../types.js';
import { ObjectId } from 'mongodb';

async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const decodedToken = await verifyToken(req.headers.authorization);
        const userId = decodedToken.sub;
        const db = await getDb();
        const users = db.collection('users');

        // FIX: Cast userId to any to resolve MongoDB driver type mismatch for _id.
        const currentUser = await users.findOne({ _id: userId as any });
        if (!currentUser) {
            return res.status(404).json({ message: "Current user not found." });
        }

        switch (req.method) {
            case 'GET':
                return await handleGet(res, users, currentUser);
            case 'POST':
                return await handlePost(req, res, db, userId);
            case 'PUT':
                return await handlePut(req, res, users, userId);
            case 'DELETE':
                return await handleDelete(req, res, users, userId);
            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Friends API error:', error);
        if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}

async function handleGet(res: VercelResponse, users: any, currentUser: any) {
    const friendIds = currentUser.data.friends || [];
    const requestIds = currentUser.data.friendRequestsReceived || [];

    const friendsData = friendIds.length > 0 
      ? await users.find({ _id: { $in: friendIds } }).project({ username: 1, isVerified: 1, role: 1 }).toArray()
      : [];
    const requestsData = requestIds.length > 0
      ? await users.find({ _id: { $in: requestIds } }).project({ username: 1 }).toArray()
      : [];

    const response: FriendData = {
        friends: friendsData.map((u: any) => ({ userId: u._id, username: u.username, isVerified: u.isVerified, role: u.role })),
        requests: requestsData.map((u: any) => ({ userId: u._id, username: u.username })),
    };
    return res.status(200).json(response);
}

async function handlePost(req: VercelRequest, res: VercelResponse, db: any, userId: string) {
    const { action, targetUserId, publicPhraseId } = req.body;
    const users = db.collection('users');
    
    if (action === 'like') {
        if (!publicPhraseId) return res.status(400).json({ message: "publicPhraseId is required." });
        const phrases = db.collection('public_phrases');
        const phrase = await phrases.findOne({ _id: new ObjectId(publicPhraseId) });
        if (!phrase) return res.status(404).json({ message: "Phrase not found." });
        const isLiked = phrase.likes?.includes(userId);
        const updateOperation = isLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } };
        await phrases.updateOne({ _id: new ObjectId(publicPhraseId) }, updateOperation);
        return res.status(200).json({ success: true, liked: !isLiked });
    }

    if (action === 'add') {
        if (!targetUserId || userId === targetUserId) return res.status(400).json({ message: "Invalid target user." });
        const targetUser = await users.findOne({ _id: targetUserId });
        if (!targetUser) return res.status(404).json({ message: "Target user not found." });
        
        const isAlreadyFriends = targetUser.data.friends?.includes(userId);
        const hasSentRequest = targetUser.data.friendRequestsReceived?.includes(userId);
        if(isAlreadyFriends || hasSentRequest) return res.status(409).json({message: "Already friends or request sent."});

        await users.updateOne({ _id: userId as any }, { $addToSet: { "data.friendRequestsSent": targetUserId } });
        await users.updateOne({ _id: targetUserId as any }, { $addToSet: { "data.friendRequestsReceived": userId } });
        return res.status(200).json({ success: true });
    }

    return res.status(400).json({ message: "Invalid action specified." });
}

async function handlePut(req: VercelRequest, res: VercelResponse, users: any, userId: string) {
    const { targetUserId, action } = req.body;
    if (!targetUserId || !['accept', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Invalid data." });
    }
    
    // Always remove the request regardless of action
    await users.updateOne({ _id: userId as any }, { $pull: { "data.friendRequestsReceived": targetUserId } });
    await users.updateOne({ _id: targetUserId as any }, { $pull: { "data.friendRequestsSent": userId } });
    
    if (action === 'accept') {
        await users.updateOne({ _id: userId as any }, { $addToSet: { "data.friends": targetUserId } });
        await users.updateOne({ _id: targetUserId as any }, { $addToSet: { "data.friends": userId } });
    }

    return res.status(200).json({ success: true });
}

async function handleDelete(req: VercelRequest, res: VercelResponse, users: any, userId: string) {
    const { targetUserId } = req.body;
    if (!targetUserId) {
        return res.status(400).json({ message: "Invalid target user." });
    }

    // Remove from both users' friend lists
    await users.updateOne({ _id: userId as any }, { $pull: { "data.friends": targetUserId } });
    await users.updateOne({ _id: targetUserId as any }, { $pull: { "data.friends": userId } });

    return res.status(200).json({ success: true });
}

export default handler;