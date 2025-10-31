// api/profile.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken, DecodedToken } from './_utils/auth.js';
import { getInitialUserData } from './_shared/data.js';
import { UserProfile, Phrase } from '../../types.js';
import { Db } from 'mongodb';

async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const decodedToken = await verifyToken(req.headers.authorization);
        const userId = decodedToken.sub;
        const db = await getDb();
        
        // Data Migration: Ensure all cats have a rarity.
        // This is an idempotent operation that fixes the collection.
        await db.collection('cat_images').updateMany(
            { rarity: { $exists: false } },
            { $set: { rarity: 'common' } }
        );

        const users = db.collection('users');

        switch (req.method) {
            case 'GET':
                return await handleGet(res, users, userId, decodedToken);
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

async function handleGet(res: VercelResponse, users: any, userId: string, decodedToken: DecodedToken) {
    const adminUserId = 'google-oauth2|107222277373277873883';
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
        };
        
        if (JSON.stringify(repairedData) !== JSON.stringify(existingData)) {
            userProfile.data = repairedData;
            await users.updateOne({ _id: userId }, { $set: { data: repairedData } });
        }

        // Add migration for username field from email if it doesn't exist
        if (!userProfile.username && userProfile.email) {
            userProfile.username = userProfile.email;
            await users.updateOne({ _id: userId as any }, { $set: { username: userProfile.email } });
        }

        // Ensure the specified user has admin role
        if (userId === adminUserId && userProfile.role !== 'admin') {
            userProfile.role = 'admin';
            await users.updateOne({ _id: userId }, { $set: { role: 'admin' } });
        }
    }

    const responsePayload: UserProfile = {
        id: userProfile._id,
        username: userProfile.username || userProfile.email, // Fallback for safety
        role: userProfile.role,
        isVerified: userProfile.isVerified,
        data: userProfile.data,
    };
    
    return res.status(200).json(responsePayload);
}

async function handlePost(req: VercelRequest, res: VercelResponse, db: Db, userId: string) {
    const { data } = req.body;
    if (!data) {
        return res.status(400).json({ message: 'No data provided to update.' });
    }
    const users = db.collection('users');

    // Sanitize and prepare the update object
    const updateObject: { [key: string]: any } = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            // Handle phrases specially to ensure public phrases are updated
            if (key === 'phrases') {
                await updatePublicPhrases(db, userId, data.phrases);
            }
            updateObject[`data.${key}`] = data[key];
        }
    }

    if (Object.keys(updateObject).length === 0) {
        return res.status(200).json({ message: 'No fields to update.' });
    }

    const result = await users.updateOne({ _id: userId as any }, { $set: updateObject });

    if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).send('User data saved successfully.');
}

async function handlePut(req: VercelRequest, res: VercelResponse, users: any, userId: string) {
    const { username, bio } = req.body;

    if (!username || bio === undefined) {
        return res.status(400).json({ message: 'Username and bio are required.' });
    }
    
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return res.status(400).json({ message: 'Invalid username format.' });
    }
    
    // Check if username is already taken by another user
    const existingUser = await users.findOne({ username: username, _id: { $ne: userId } });
    if (existingUser) {
        return res.status(409).json({ message: 'Username is already taken.' });
    }

    const updateData: { email: string, 'data.bio': string, username: string } = {
        email: username, // email field holds the username
        'data.bio': bio,
        username: username
    };

    await users.updateOne({ _id: userId as any }, { $set: updateData });

    // Also update username in public phrases
    const db = await getDb();
    await db.collection('public_phrases').updateMany(
        { userId: userId },
        { $set: { username: username } }
    );

    return res.status(200).json({ message: 'Profile updated successfully' });
}

// Helper to manage public phrases when user saves their phrase list
async function updatePublicPhrases(db: Db, userId: string, newPhrases: Phrase[]) {
    const publicPhrasesCollection = db.collection('public_phrases');
    const catImagesCollection = db.collection('cat_images');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: userId as any });
    if (!user) return;

    // Find all phrases the user wants to be public
    const publicPhraseIntents = newPhrases.filter(p => p.isPublic && p.isCustom);
    const publicPhraseIds = publicPhraseIntents.map(p => p.id);
    
    // Remove any phrases from public that are no longer marked as public
    await publicPhrasesCollection.deleteMany({ userId: userId, phraseId: { $nin: publicPhraseIds } });

    // Add/update public phrases
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