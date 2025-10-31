// api/community.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { ObjectId } from 'mongodb';

async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { resource, username, query } = req.query;

    try {
        const db = await getDb();
        
        if (resource === 'catalog') {
            const catalog = db.collection('cat_images');
            // FIX: MongoDB driver returns _id, so we project to match the CatImage type.
            const allImages = await catalog.find({}).project({ _id: 0, id: 1, url: 1, theme: 1, rarity: 1 }).sort({ id: 1 }).toArray();
            return res.status(200).json(allImages);
        }

        // For all other resources, authentication is required.
        const decodedToken = await verifyToken(req.headers.authorization);
        const currentUserId = decodedToken.sub;
        
        if (resource === 'profile' && typeof username === 'string') {
            return await getPublicProfile(res, db, username, currentUserId);
        }

        if (resource === 'search' && typeof query === 'string') {
            return await searchUsers(res, db, query);
        }

        if (resource === 'feed') {
            return await getPublicFeed(res, db, currentUserId);
        }

        return res.status(400).json({ message: "Invalid resource requested." });

    } catch (error) {
        console.error('Community API error:', error);
        if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}

async function getPublicProfile(res: VercelResponse, db: any, username: string, currentUserId: string) {
    const users = db.collection('users');
    const publicPhrases = db.collection('public_phrases');
    const catImages = db.collection('cat_images');

    const profileUser = await users.findOne({ username });
    if (!profileUser) {
        return res.status(404).json({ message: 'User not found' });
    }

    const phrasesCursor = publicPhrases.find({ userId: profileUser._id }).sort({ _id: -1 });
    const phrases = await phrasesCursor.toArray();

    const unlockedImageIds = profileUser.data.unlockedImageIds || [];
    const unlockedImages = await catImages.find({ id: { $in: unlockedImageIds } }).project({ _id: 0 }).toArray();

    const response = {
        userId: profileUser._id,
        username: profileUser.username,
        role: profileUser.role,
        isVerified: profileUser.isVerified,
        bio: profileUser.data.bio,
        phrases: phrases.map((p: any) => ({
            publicPhraseId: p._id.toHexString(),
            text: p.text,
            imageUrl: p.imageUrl,
            imageTheme: p.imageTheme,
            likeCount: p.likes?.length || 0,
            isLikedByMe: p.likes?.includes(currentUserId) || false,
            userId: p.userId, // Pass authorId for mission updates
        })),
        unlockedImages: unlockedImages,
    };
    return res.status(200).json(response);
}

async function searchUsers(res: VercelResponse, db: any, query: string) {
    if (query.length < 2) {
        return res.status(200).json([]);
    }
    const users = db.collection('users');
    // Using a regex for case-insensitive search.
    const searchCursor = users.find({ username: { $regex: `^${query}`, $options: 'i' } })
        .limit(10)
        .project({ username: 1, isVerified: 1 });
    const searchResults = await searchCursor.toArray();
    const response = searchResults.map((u: any) => ({
        username: u.username,
        isVerified: u.isVerified || false,
    }));
    return res.status(200).json(response);
}

async function getPublicFeed(res: VercelResponse, db: any, currentUserId: string) {
    const publicPhrases = db.collection('public_phrases');
    // Get latest 20 phrases
    const feedCursor = publicPhrases.find({}).sort({ _id: -1 }).limit(20);
    const feedPhrases = await feedCursor.toArray();

    const response = feedPhrases.map((p: any) => ({
        publicPhraseId: p._id.toHexString(),
        text: p.text,
        imageUrl: p.imageUrl,
        imageTheme: p.imageTheme,
        likeCount: p.likes?.length || 0,
        isLikedByMe: p.likes?.includes(currentUserId) || false,
        username: p.username,
        isUserVerified: p.isUserVerified,
        userId: p.userId, // Pass authorId for mission updates
    }));
    return res.status(200).json(response);
}

export default handler;