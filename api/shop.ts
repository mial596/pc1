// api/shop.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_utils/mongodb.js';
import { verifyToken } from './_utils/auth.js';
import { CatImage, Envelope, EnvelopeTypeId } from '../../types.js';

const calculateEnvelopeCost = (envelope: Envelope, playerLevel: number): number => {
  return envelope.baseCost + ((playerLevel - 1) * envelope.costIncreasePerLevel);
};


async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const db = await getDb();

        if (req.method === 'GET') {
            const { resource } = req.query;
            if (resource === 'data') {
                const envelopesCollection = db.collection('envelopes');
                const upgradesCollection = db.collection('upgrades');
                const [envelopes, upgrades] = await Promise.all([
                    envelopesCollection.find({}).sort({ baseCost: 1 }).toArray(),
                    upgradesCollection.find({}).sort({ levelRequired: 1 }).toArray()
                ]);
                return res.status(200).json({ envelopes, upgrades });
            }
        }
        
        // All other methods require auth
        const decodedToken = await verifyToken(req.headers.authorization);
        const userId = decodedToken.sub;
        const users = db.collection('users');
        const catalog = db.collection('cat_images');

        const currentUser = await users.findOne({ _id: userId as any });
        if (!currentUser) {
            return res.status(404).json({ message: "User not found." });
        }

        if (req.method === 'POST') {
            const { action, envelopeId } = req.body;
            if (action === 'purchaseEnvelope') {
                const envelopesCollection = db.collection('envelopes');
                const envelope = await envelopesCollection.findOne({ id: envelopeId as EnvelopeTypeId });

                if (!envelope) {
                    return res.status(400).json({ message: "Invalid envelopeId." });
                }
                
                // --- Dynamic Pricing Logic ---
                const themeQuery = (envelope.catThemePool && envelope.catThemePool.length > 0)
                    ? { theme: { $in: envelope.catThemePool } }
                    : {};

                const allImagesInPool = await catalog.find(themeQuery).project({_id: 0}).toArray();
                const unlockedIds = new Set(currentUser.data.unlockedImageIds || []);
                const remainingImages = allImagesInPool.filter(img => !unlockedIds.has(img.id));

                if (remainingImages.length === 0) {
                    return res.status(400).json({ message: "Ya tienes todos los gatos de este sobre." });
                }
                
                const imagesToGetCount = Math.min(remainingImages.length, envelope.imageCount);
                const originalCost = calculateEnvelopeCost(envelope as any, currentUser.data.playerStats.level);
                
                const proratedCost = envelope.imageCount > 0 
                    ? Math.ceil(originalCost * (imagesToGetCount / envelope.imageCount))
                    : originalCost;

                if (currentUser.data.coins < proratedCost) {
                    return res.status(402).json({ message: "Not enough coins." });
                }
                
                // Get a random subset of the remaining images
                const shuffledRemaining = remainingImages.sort(() => 0.5 - Math.random());
                const newImages = shuffledRemaining.slice(0, imagesToGetCount);
                const newImageIds = newImages.map(img => img.id);

                const newCoins = currentUser.data.coins - proratedCost;
                
                await users.updateOne(
                    { _id: userId as any },
                    {
                        $set: { 'data.coins': newCoins },
                        $addToSet: { 'data.unlockedImageIds': { $each: newImageIds } }
                    }
                );

                return res.status(200).json({ newCoins, newImages });
            }
        }
        
        res.setHeader('Allow', ['GET', 'POST']);
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