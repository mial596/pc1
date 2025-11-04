// api/community.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { ObjectId } from 'mongodb';
import { resolveProfilePictureUrl, resolveProfilePicturesForUsers } from './profile.js';

async function handler(req: VercelRequest, res: VercelResponse) {
    const db = await getDb();
    if (req.method === 'POST') {
        try {
            const decodedToken = await verifyToken(req.headers.authorization);
            const userId = decodedToken.sub;
            const { action, publicPhraseId, text, type, contentId, reason } = req.body;

            if (action === 'addComment') {
                if (!publicPhraseId || !text) return res.status(400).json({ message: "Missing parameters." });
                const users = db.collection('users');
                // FIX: Cast string userId to 'any' to match MongoDB driver's expected type for _id.
                const user = await users.findOne({ _id: userId as any });
                if (!user) return res.status(404).json({ message: "User not found." });
                
                const profilePictureUrl = await resolveProfilePictureUrl(db, user);
                const newComment = {
                    _id: new ObjectId(),
                    publicPhraseId: new ObjectId(publicPhraseId),
                    userId,
                    username: user.username,
                    role: user.role || 'user',
                    profilePictureUrl,
                    text,
                    createdAt: new Date().toISOString(),
                };
                // FIX: Cast the pushed comment object to 'any' to resolve 'assignable to never' error.
                await db.collection('public_phrases').updateOne({ _id: new ObjectId(publicPhraseId) }, { $push: { comments: newComment as any } });
                return res.status(201).json(newComment);
            }
            
            if (action === 'report') {
                if (!type || !contentId || !reason) return res.status(400).json({ message: "Missing parameters for report." });
                const users = db.collection('users');
                // FIX: Cast string userId to 'any' to match MongoDB driver's expected type for _id.
                const reporter = await users.findOne({ _id: userId as any });
                
                let content;
                let contentAuthorId;
                if (type === 'phrase') {
                    content = await db.collection('public_phrases').findOne({ _id: new ObjectId(contentId) });
                    contentAuthorId = content?.userId;
                } else { // comment
                    const phraseContainingComment = await db.collection('public_phrases').findOne({ "comments._id": new ObjectId(contentId) });
                    content = phraseContainingComment?.comments.find((c: any) => c._id.toHexString() === contentId);
                    contentAuthorId = content?.userId;
                }
                
                if (!content || !contentAuthorId) return res.status(404).json({ message: "Content to report not found." });
                
                const author = await users.findOne({ _id: contentAuthorId });
                
                const newReport = {
                    reporterUserId: userId,
                    reporterUsername: reporter.username,
                    type,
                    contentId,
                    contentText: content.text,
                    contentAuthorId,
                    contentAuthorUsername: author.username,
                    reason,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                };
                
                await db.collection('reports').insertOne(newReport);
                return res.status(200).json({ success: true });
            }


        } catch (error) {
             console.error('Community POST API error:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }


    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { resource, username, query } = req.query;

    try {
        
        if (resource === 'catalog') {
            const catalog = db.collection('cat_images');
            const allImages = await catalog.find({}).project({ _id: 0, id: 1, url: 1, theme: 1, rarity: 1, isShiny: 1 }).sort({ id: 1 }).toArray();
            return res.status(200).json(allImages);
        }

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
        console.error('Community GET API error:', error);
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
    
    const userData = profileUser.data || {};
    const phrasesCursor = publicPhrases.find({ userId: profileUser._id }).sort({ _id: -1 });
    const phrases = await phrasesCursor.toArray();
    const unlockedImageIds = userData.unlockedImageIds || [];
    const unlockedImages = await catImages.find({ id: { $in: unlockedImageIds } }).project({ _id: 0 }).toArray();

    const profilePictureUrl = await resolveProfilePictureUrl(db, profileUser);

    const response = {
        userId: profileUser._id,
        username: profileUser.username,
        role: profileUser.role,
        isVerified: profileUser.isVerified,
        bio: userData.bio || '',
        profilePictureUrl: profilePictureUrl,
        phrases: phrases.map((p: any) => ({
            publicPhraseId: p._id.toHexString(),
            text: p.text,
            imageUrl: p.imageUrl,
            imageTheme: p.imageTheme,
            likeCount: p.likes?.length || 0,
            isLikedByMe: p.likes?.includes(currentUserId) || false,
            userId: p.userId,
            comments: p.comments || [],
            commentCount: p.comments?.length || 0,
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
    const searchCursor = users.find({ username: { $regex: `^${query}`, $options: 'i' } })
        .limit(10)
        .project({ username: 1, isVerified: 1, data: { profilePictureId: 1 } });
    const searchResults = await searchCursor.toArray();

    const usersWithPics = await resolveProfilePicturesForUsers(db, searchResults);

    const response = usersWithPics.map((u: any) => ({
        username: u.username,
        isVerified: u.isVerified || false,
        profilePictureUrl: u.profilePictureUrl,
    }));
    return res.status(200).json(response);
}

async function getPublicFeed(res: VercelResponse, db: any, currentUserId: string) {
    const publicPhrases = db.collection('public_phrases');
    const feedCursor = publicPhrases.find({}).sort({ _id: -1 }).limit(20);
    const feedPhrases = await feedCursor.toArray();

    const userIds = [...new Set(feedPhrases.map(p => p.userId))];
    const users = await db.collection('users').find({ _id: { $in: userIds } }).project({_id: 1, data: { profilePictureId: 1 }, role: 1 }).toArray();
    const usersWithPics = await resolveProfilePicturesForUsers(db, users);
    const userMap = new Map(usersWithPics.map(u => [u._id, { pic: u.profilePictureUrl, role: u.role }]));

    const response = feedPhrases.map((p: any) => ({
        publicPhraseId: p._id.toHexString(),
        text: p.text,
        imageUrl: p.imageUrl,
        imageTheme: p.imageTheme,
        likeCount: p.likes?.length || 0,
        isLikedByMe: p.likes?.includes(currentUserId) || false,
        username: p.username,
        isUserVerified: p.isUserVerified || false,
        role: userMap.get(p.userId)?.role || 'user',
        userId: p.userId,
        profilePictureUrl: userMap.get(p.userId)?.pic,
        comments: p.comments || [],
        commentCount: p.comments?.length || 0,
    }));
    return res.status(200).json(response);
}

export default handler;