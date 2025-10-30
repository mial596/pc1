// api/shop.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { ENVELOPES, calculateEnvelopeCost } from '../../shopData.js';
import { CatImage, EnvelopeTypeId } from '../../types.js';

// A helper function to get random images
const getRandomImages = (allImages: CatImage[], unlockedIds: number[], count: number): CatImage[] => {
    const availableImages = allImages.filter(img => !unlockedIds.includes(img.id));
    const shuffled = availableImages.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};


async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const decodedToken = await verifyToken(req.headers.authorization);
        const userId = decodedToken.sub;
        const db = await getDb();
        const users = db.collection('users');
        const catalog = db.collection('cat_images');

        // FIX: Cast userId to any to resolve MongoDB driver type mismatch for _id.
        const currentUser = await users.findOne({ _id: userId as any });
        if (!currentUser) {
            return res.status(404).json({ message: "User not found." });
        }

        if (req.method === 'POST') {
            const { action, envelopeId } = req.body;
            if (action === 'purchaseEnvelope') {
                if (!envelopeId || !ENVELOPES[envelopeId as EnvelopeTypeId]) {
                    return res.status(400).json({ message: "Invalid envelopeId." });
                }

                const envelope = ENVELOPES[envelopeId as EnvelopeTypeId];
                const cost = calculateEnvelopeCost(envelope, currentUser.data.playerStats.level);

                if (currentUser.data.coins < cost) {
                    return res.status(402).json({ message: "Not enough coins." });
                }

                const allImages = await catalog.find({}).project({_id: 0}).toArray();
                const newImages = getRandomImages(allImages as any[], currentUser.data.unlockedImageIds, envelope.imageCount);
                const newImageIds = newImages.map(img => img.id);

                const newCoins = currentUser.data.coins - cost;
                
                if (newImageIds.length > 0) {
                    await users.updateOne(
                        // FIX: Cast userId to any to resolve MongoDB driver type mismatch for _id.
                        { _id: userId as any },
                        {
                            $set: { 'data.coins': newCoins },
                            $addToSet: { 'data.unlockedImageIds': { $each: newImageIds } }
                        }
                    );
                } else {
                     await users.updateOne(
                        // FIX: Cast userId to any to resolve MongoDB driver type mismatch for _id.
                        { _id: userId as any },
                        { $set: { 'data.coins': newCoins } }
                    );
                }

                return res.status(200).json({ newCoins, newImages });
            }
        }
        
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);

    } catch (error) {
        console.error('Shop API error:', error);
        if (error instanceof Error && (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: 'Internal Server Error', error: errorMessage });
    }
}

export default handler;
