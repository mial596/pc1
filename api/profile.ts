// api/profile.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken, DecodedToken } from './_utils/auth.js';
import { getInitialUserData } from './_shared/data.js';
import { UserProfile, Phrase, Friendship } from '../../types.js';
import { Db, ObjectId, WithId } from 'mongodb';

export async function resolveProfilePictureUrl(db: Db, user: WithId<any> | null): Promise<string | undefined> {
    if (user?.data?.profilePictureId) {
        const image = await db.collection('cat_images').findOne({ id: user.data.profilePictureId });
        return image?.url;
    }
    return undefined;
}

export async function resolveProfilePicturesForUsers(db: Db, users: any[]) {
    const picIds = users.map(u => u.data?.profilePictureId).filter(id => id != null);
    if (picIds.length === 0) return users.map(u => ({ ...u, profilePictureUrl: undefined }));

    const images = await db.collection('cat_images').find({ id: { $in: picIds } }).project({ id: 1, url: 1 }).toArray();
    const imageUrlMap = new Map(images.map(img => [img.id, img.url]));

    return users.map(u => ({
        ...u,
        profilePictureUrl: u.data?.profilePictureId ? imageUrlMap.get(u.data.profilePictureId) : undefined
    }));
}


async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const decodedToken = await verifyToken(req.headers.authorization);
        const userId = decodedToken.sub;
        const db = await getDb();
        
        await db.collection('cat_images').updateMany(
            { rarity: { $exists: false } },
            { $set: { rarity: 'common' } }
        );

        const users = db.collection('users');

        switch (req.method) {
            case 'GET':
                return await handleGet(req, res, db, userId, decodedToken);
            case 'POST':
                return await handlePost(req, res, db, userId);
            case 'PUT':
                return await handlePut(req, res, users, userId);
            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT']);
                return res.status(405).end(`Method ${req.method} Not Allowed`);
        }
    } catch (error) {
        console.error('Profile API error:', error);
        if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}

async function handleGet(req: VercelRequest, res: VercelResponse, db: Db, userId: string, decodedToken: DecodedToken) {
    const adminUserId = 'google-oauth2|107222277373277873883';
    const users = db.collection('users');
    let userProfile = await users.findOne({ _id: userId });

    if (!userProfile) {
        // User does not exist, create a new profile
        const username = decodedToken.email?.split('@')[0] || `user_${userId.split('|')[1] || Math.random().toString(36).substring(2,8)}`;
        const initialData = getInitialUserData();
        const newUser = {
            username: username,
            email: username, // For backward compatibility / reference
            role: userId === adminUserId ? 'admin' : 'user',
            isVerified: false,
            data: initialData,
        };
        await users.insertOne({ _id: userId, ...newUser });
        userProfile = { _id: userId, ...newUser };
    } else {
        // User exists, ensure their data is complete and valid.
        const initialData = getInitialUserData();
        const existingData = userProfile.data || {};

        const repairedData = {
            ...initialData,
            ...existingData,
            playerStats: { ...initialData.playerStats, ...(existingData.playerStats || {}), },
            phrases: Array.isArray(existingData.phrases) ? existingData.phrases : initialData.phrases,
            unlockedImageIds: Array.isArray(existingData.unlockedImageIds) ? existingData.unlockedImageIds : initialData.unlockedImageIds,
            purchasedUpgrades: Array.isArray(existingData.purchasedUpgrades) ? existingData.purchasedUpgrades : initialData.purchasedUpgrades,
            friendRequestsSent: Array.isArray(existingData.friendRequestsSent) ? existingData.friendRequestsSent : initialData.friendRequestsSent,
            friendRequestsReceived: Array.isArray(existingData.friendRequestsReceived) ? existingData.friendRequestsReceived : initialData.friendRequestsReceived,
        };
        
        if (repairedData.friends && Array.isArray(repairedData.friends) && repairedData.friends.length > 0) {
            const friendshipsCollection = db.collection('friendships');
            for (const friendId of repairedData.friends) {
                const existingFriendship = await friendshipsCollection.findOne({
                    $or: [ { user1Id: userId, user2Id: friendId }, { user1Id: friendId, user2Id: userId } ]
                });
                if (!existingFriendship) {
                    await friendshipsCollection.insertOne({ user1Id: userId, user2Id: friendId, level: 1, xp: 0, activeMission: null });
                }
            }
            await users.updateOne({ _id: userId }, { $unset: { "data.friends": "" } });
            delete repairedData.friends;
        }

        if (JSON.stringify(repairedData) !== JSON.stringify(existingData)) {
            userProfile.data = repairedData;
            await users.updateOne({ _id: userId }, { $set: { data: repairedData } });
        }

        if (!userProfile.username && userProfile.email) {
            userProfile.username = userProfile.email;
            await users.updateOne({ _id: userId as any }, { $set: { username: userProfile.email } });
        }

        if (userId === adminUserId && userProfile.role !== 'admin') {
            userProfile.role = 'admin';
            await users.updateOne({ _id: userId }, { $set: { role: 'admin' } });
        }
    }
    
    const friendshipsCollection = db.collection('friendships');
    const friendshipDocs = await friendshipsCollection.find({ $or: [{ user1Id: userId }, { user2Id: userId }] }).toArray();
    const friendships: Friendship[] = friendshipDocs.map(doc => ({
        _id: doc._id.toHexString(),
        userId: doc.user1Id === userId ? doc.user2Id : doc.user1Id,
        level: doc.level,
        xp: doc.xp,
        activeMission: doc.activeMission,
    }));
    
    const profilePictureUrl = await resolveProfilePictureUrl(db, userProfile);

    const responsePayload: UserProfile = {
        id: userProfile._id,
        username: userProfile.username || userProfile.email,
        role: userProfile.role,
        isVerified: userProfile.isVerified,
        profilePictureUrl: profilePictureUrl,
        data: {
            ...userProfile.data,
            friendships: friendships,
        },
    };
    
    return res.status(200).json(responsePayload);
}

async function handlePost(req: VercelRequest, res: VercelResponse, db: Db, userId: string) {
    const { data } = req.body;
    if (!data) return res.status(400).json({ message: 'No data provided to update.' });
    const users = db.collection('users');

    const updateObject: { [key: string]: any } = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            if (key === 'phrases') {
                await updatePublicPhrases(db, userId, data.phrases);
            }
            updateObject[`data.${key}`] = data[key];
        }
    }

    if (Object.keys(updateObject).length === 0) return res.status(200).json({ message: 'No fields to update.' });

    const result = await users.updateOne({ _id: userId as any }, { $set: updateObject });
    if (result.matchedCount === 0) return res.status(404).json({ message: 'User not found.' });
    return res.status(200).send('User data saved successfully.');
}

async function handlePut(req: VercelRequest, res: VercelResponse, users: any, userId: string) {
    const { username, bio, profilePictureId } = req.body;
    if (!username || bio === undefined) return res.status(400).json({ message: 'Username and bio are required.' });
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({ message: 'Invalid username format.' });
    const existingUser = await users.findOne({ username: username, _id: { $ne: userId } });
    if (existingUser) return res.status(409).json({ message: 'Username is already taken.' });
    
    const updateData = { 'data.bio': bio, 'data.profilePictureId': profilePictureId, username: username };
    await users.updateOne({ _id: userId as any }, { $set: updateData });
    const db = await getDb();
    await db.collection('public_phrases').updateMany({ userId: userId }, { $set: { username: username } });
    return res.status(200).json({ message: 'Profile updated successfully' });
}

async function updatePublicPhrases(db: Db, userId: string, newPhrases: Phrase[]) {
    const publicPhrasesCollection = db.collection('public_phrases');
    const catImagesCollection = db.collection('cat_images');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: userId as any });
    if (!user) return;

    const publicPhraseIntents = newPhrases.filter(p => p.isPublic && p.isCustom);
    const publicPhraseIds = publicPhraseIntents.map(p => p.id);
    await publicPhrasesCollection.deleteMany({ userId: userId, phraseId: { $nin: publicPhraseIds } });

    for (const phrase of publicPhraseIntents) {
        if (!phrase.selectedImageId) continue;
        const image = await catImagesCollection.findOne({ id: phrase.selectedImageId });
        if (!image) continue;

        await publicPhrasesCollection.updateOne(
            { userId: userId, phraseId: phrase.id },
            { $set: { text: phrase.text, imageUrl: image.url, imageTheme: image.theme, username: user.username, isUserVerified: user.isVerified || false }, $setOnInsert: { likes: [] } },
            { upsert: true }
        );
    }
}

export default handler;