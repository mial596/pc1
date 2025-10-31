// api/friends.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { FriendData, Friendship, UserProfile } from '../../types.js';
import { ALL_MISSIONS } from '../../gameData/missions.js';
import { ObjectId, Db } from 'mongodb';
import { updateDailyMissionProgress } from './_utils/missions.js';


const MAX_FRIENDSHIP_LEVEL = 10;
const XP_PER_LEVEL = 200;

async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const decodedToken = await verifyToken(req.headers.authorization);
        const userId = decodedToken.sub;
        const db = await getDb();

        switch (req.method) {
            case 'GET':
                return await handleGet(res, db, userId);
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
        console.error('Friends API error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}

async function handleGet(res: VercelResponse, db: Db, userId: string) {
    const users = db.collection('users');
    const friendships = db.collection('friendships');

    const currentUser = await users.findOne({ _id: userId });
    if (!currentUser) return res.status(404).json({ message: "User not found." });
    
    const currentUserData = currentUser.data || {};

    // Get friends from the new 'friendships' collection
    const friendDocs = await friendships.find({ $or: [{ user1Id: userId }, { user2Id: userId }] }).toArray();
    const friendIdsFromCollection = friendDocs.map(f => f.user1Id === userId ? f.user2Id : f.user1Id);

    // Get friends from the old 'data.friends' array for backward compatibility
    const friendIdsFromArray = (currentUserData.friends && Array.isArray(currentUserData.friends)) ? currentUserData.friends : [];

    // Combine and get unique IDs
    const allFriendIds = [...new Set([...friendIdsFromCollection, ...friendIdsFromArray])];
    
    const friendsData = allFriendIds.length > 0
      ? await users.find({ _id: { $in: allFriendIds } }).project({ username: 1, isVerified: 1, role: 1 }).toArray()
      : [];
    
    const requestIds = Array.isArray(currentUserData.friendRequestsReceived) ? currentUserData.friendRequestsReceived : [];
    const requestsData = requestIds.length > 0
      ? await users.find({ _id: { $in: requestIds } }).project({ username: 1 }).toArray()
      : [];

    const response: FriendData = {
        friends: friendsData.map((u: any) => {
            const friendshipDoc = friendDocs.find(f => (f.user1Id === userId && f.user2Id === u._id) || (f.user1Id === u._id && f.user2Id === userId));
            let friendship: Friendship | null = null;
            
            if (friendshipDoc) {
                friendship = {
                    _id: friendshipDoc._id.toHexString(),
                    userId: u._id,
                    level: friendshipDoc.level,
                    xp: friendshipDoc.xp,
                    activeMission: friendshipDoc.activeMission,
                };
            } else if (friendIdsFromArray.includes(u._id)) {
                // For friends from the old system without a friendship doc, create a default object.
                // The migration in /api/profile will create the real document eventually.
                friendship = {
                    _id: new ObjectId().toHexString(), // Dummy ID, won't be saved
                    userId: u._id,
                    level: 1,
                    xp: 0,
                    activeMission: null,
                };
            }

            return { userId: u._id, username: u.username, isVerified: u.isVerified, role: u.role, friendship };
        }),
        requests: requestsData.map((u: any) => ({ userId: u._id, username: u.username })),
    };
    return res.status(200).json(response);
}


async function handlePost(req: VercelRequest, res: VercelResponse, db: Db, userId: string) {
    const { action, targetUserId, publicPhraseId, authorId, friendshipId, missionId } = req.body;
    const users = db.collection('users');
    const friendships = db.collection('friendships');

    if (action === 'like') {
        if (!publicPhraseId || !authorId) return res.status(400).json({ message: "publicPhraseId and authorId are required." });
        const phrases = db.collection('public_phrases');
        const phrase = await phrases.findOne({ _id: new ObjectId(publicPhraseId) });
        if (!phrase) return res.status(404).json({ message: "Phrase not found." });
        const isLiked = phrase.likes?.includes(userId);
        const updateOperation = isLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } };
        await phrases.updateOne({ _id: new ObjectId(publicPhraseId) }, updateOperation);

        if(!isLiked) {
             await updateMissionProgress(friendships, userId, authorId, 'LIKE_PHRASES', 1);
             // Also update daily mission progress
             await updateDailyMissionProgress(db, userId, 'LIKE_PUBLIC_PHRASE', 1);
        }
        
        const updatedProfile = await users.findOne({ _id: userId });
        return res.status(200).json({ success: true, liked: !isLiked, updatedProfile });
    }

    if (action === 'add') {
        if (!targetUserId || userId === targetUserId) return res.status(400).json({ message: "Invalid target user." });
        const fromUser = await users.findOne({ _id: userId as any });
        const targetUser = await users.findOne({ _id: targetUserId as any });
        if (!targetUser || !fromUser) return res.status(404).json({ message: "User not found." });
        
        const targetUserData = targetUser.data || {};

        // Check new system
        const existingFriendship = await friendships.findOne({ $or: [{ user1Id: userId, user2Id: targetUserId }, { user1Id: targetUserId, user2Id: userId }] });
        
        // Check old system for backward compatibility
        const areFriendsInOldSystem = (fromUser.data?.friends?.includes(targetUserId)) || (targetUserData.friends?.includes(userId));
        
        const targetUserRequests = Array.isArray(targetUserData.friendRequestsReceived) ? targetUserData.friendRequestsReceived : [];
        const hasSentRequest = targetUserRequests.includes(userId);
        
        if(existingFriendship || areFriendsInOldSystem || hasSentRequest) return res.status(409).json({message: "Already friends or request sent."});

        await users.updateOne({ _id: userId as any }, { $addToSet: { "data.friendRequestsSent": targetUserId } });
        await users.updateOne({ _id: targetUserId as any }, { $addToSet: { "data.friendRequestsReceived": userId } });
        return res.status(200).json({ success: true });
    }
    
    if(action === 'startMission') {
        if(!friendshipId || !missionId) return res.status(400).json({ message: "friendshipId and missionId are required." });
        const missionData = ALL_MISSIONS.find(m => m.id === missionId);
        if(!missionData) return res.status(404).json({ message: "Mission not found." });

        const newMission = {
            missionId: missionData.id,
            progress: 0,
            goal: missionData.goal,
            isCompleted: false,
        };
        await friendships.updateOne({_id: new ObjectId(friendshipId)}, {$set: { activeMission: newMission }});
        return res.status(200).json({ success: true });
    }
    
    if(action === 'claimReward') {
        if(!friendshipId) return res.status(400).json({ message: "friendshipId is required." });
        const friendship = await friendships.findOne({_id: new ObjectId(friendshipId)});
        if(!friendship || !friendship.activeMission?.isCompleted) return res.status(400).json({ message: "No completed mission to claim."});
        const missionData = ALL_MISSIONS.find(m => m.id === friendship.activeMission.missionId);
        if(!missionData) return res.status(404).json({ message: "Mission data not found." });

        let newXp = friendship.xp + missionData.rewardXp;
        let newLevel = friendship.level;
        while(newXp >= XP_PER_LEVEL && newLevel < MAX_FRIENDSHIP_LEVEL) {
            newXp -= XP_PER_LEVEL;
            newLevel += 1;
        }

        await friendships.updateOne({_id: new ObjectId(friendshipId)}, { $set: { level: newLevel, xp: newXp, activeMission: null }});
        return res.status(200).json({ success: true, newXp, newLevel });
    }

    return res.status(400).json({ message: "Invalid action specified." });
}

async function handlePut(req: VercelRequest, res: VercelResponse, db: Db, userId: string) {
    const { targetUserId, action } = req.body;
    if (!targetUserId || !['accept', 'reject'].includes(action)) return res.status(400).json({ message: "Invalid data." });
    
    const users = db.collection('users');
    await users.updateOne({ _id: userId as any }, { $pull: { "data.friendRequestsReceived": targetUserId } });
    await users.updateOne({ _id: targetUserId as any }, { $pull: { "data.friendRequestsSent": userId } });
    
    if (action === 'accept') {
        await db.collection('friendships').insertOne({
            user1Id: userId,
            user2Id: targetUserId,
            level: 1,
            xp: 0,
            activeMission: null,
        });
    }

    return res.status(200).json({ success: true });
}

async function handleDelete(req: VercelRequest, res: VercelResponse, db: Db, userId: string) {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ message: "Invalid target user." });
    await db.collection('friendships').deleteOne({
        $or: [{ user1Id: userId, user2Id: targetUserId }, { user1Id: targetUserId, user2Id: userId }]
    });
    return res.status(200).json({ success: true });
}

export async function updateMissionProgress(friendships: any, user1Id: string, user2Id: string, missionType: string, progressAmount: number) {
    if (user1Id === user2Id) return; // Don't give progress for liking your own phrases
    const friendship = await friendships.findOne({
        $or: [{ user1Id, user2Id }, { user1Id: user2Id, user2Id: user1Id }],
        'activeMission.missionId': { $in: ALL_MISSIONS.filter(m => m.type === missionType).map(m => m.id) },
        'activeMission.isCompleted': false
    });

    if (friendship && friendship.activeMission) {
        const newProgress = friendship.activeMission.progress + progressAmount;
        const isCompleted = newProgress >= friendship.activeMission.goal;
        await friendships.updateOne({ _id: friendship._id }, {
            $set: {
                'activeMission.progress': newProgress,
                'activeMission.isCompleted': isCompleted
            }
        });
    }
}


export default handler;